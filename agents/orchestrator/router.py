import logging
from .block_detector import detect_block
from .graph import GraphClient
from .reasoning import build_context, reasoning_engine, classify_mode
from .execution import build_execution_plan
from .execution_runner import execute_step
from .memory_layer.memory_store import MemoryStore
from .memory_layer.context_builder import build_memory_context
from .conflict import ConflictDetector, resolve_conflict
from agents.db.db_client import connect_db, create_workflow_run, save_reasoning, save_job_run, log_event
from .planner import generate_plan, save_plan
from .safety import safety_layer

logger = logging.getLogger(__name__)

# Singleton clients
graph_client = GraphClient()
memory_store = MemoryStore()
conflict_detector = ConflictDetector()

def is_planning_request(user_input: str) -> bool:
    keywords = ["build", "create", "design", "generate system"]
    return any(k in user_input.lower() for k in keywords)

async def orchestrate_flow(project_id: str, user_input: str, user_id: str = "default-user", system_trigger: bool = False) -> dict:
    """
    Main entry point for the orchestrator's graph-aware routing.
    """
    logger.info(f"Orchestrating flow for project {project_id} | Input: {user_input} | System Trigger: {system_trigger}")

    # 0. Start DB Connection and Create Workflow Run
    await connect_db()
    run_id = await create_workflow_run(project_id, user_id, user_input)
    logger.info(f"Created Workflow Run: {run_id}")

    # NEW: Safety check - Loop Protection
    if not safety_layer.check_loop(run_id):
        logger.error(f"Run {run_id} stopped: Max steps reached")
        return {"status": "stopped", "reason": "max steps reached"}

    # NEW: Detect Planning Intent
    if not system_trigger and is_planning_request(user_input):
        logger.info(f"Planning Intent detected for: {user_input}")
        plan = await generate_plan(user_input)
        await save_plan(project_id, plan)
        return {
            "status": "graph_created",
            "blocks": plan.get("blocks", [])
        }

    # Detect target block and classify mode
    target_block = detect_block(user_input)
    mode = classify_mode(user_input)
    
    # NEW: Safety check - Duplicate Execution Guard
    memory_entries = memory_store.get_recent()
    recent_blocks = [entry.get("block") for entry in memory_entries]
    
    if safety_layer.is_duplicate(target_block, recent_blocks):
        logger.warning(f"Block {target_block} skipped: Duplicate execution")
        return {"status": "skipped", "reason": "duplicate execution"}

    logger.info(f"Detected block: {target_block} | Classified mode: {mode}")

    # 2. Call Graphify APIs to find blast radius
    subgraph = await graph_client.get_subgraph(project_id, target_block)
    affected = subgraph.get("nodes", [])
    logger.info(f"Blast radius: {len(affected)} blocks affected")

    # 3. Retrieve Memory and Build Context
    memory_context = build_memory_context(memory_entries)
    context = build_context(project_id, target_block, subgraph, memory_context, user_input=user_input)

    # 4. Call reasoning engine with specific Mode
    decision = await reasoning_engine(context, mode)
    logger.info(f"Reasoning decision: {decision}")

    # Save reasoning result to DB
    await save_reasoning(project_id, target_block, mode, decision)

    if mode == "simulation":
        logger.info(f"Simulation Mode completed for {target_block}")
        return {
            "status": "simulation_complete",
            "block": target_block,
            "mode": mode,
            "decision": decision
        }

    # 5. Build execution plan
    execution_plan = build_execution_plan(decision, affected)
    logger.info(f"Initial execution plan: {execution_plan}")

    # 5b. Conflict Intelligence Layer
    conflicts = conflict_detector.detect(target_block, memory_entries)
    conflict_result = {"has_conflict": False}
    
    if conflicts:
        import json
        conflict_context = build_context(project_id, target_block, subgraph, memory_context, conflict=str(conflicts))
        conflict_decision = await reasoning_engine(conflict_context, mode="conflict_resolution")
        
        conflict_result = conflict_decision
        conflict_result["has_conflict"] = True
        logger.info(f"AI Conflict Resolution: {conflict_decision}")

        # Modify execution plan based on decision
        resolution = conflict_decision.get("resolution")
        if resolution == "manual_review":
            if "approval" not in execution_plan:
                execution_plan.append("approval")
        elif resolution == "merge":
            if "review" not in execution_plan:
                execution_plan.append("review")
                
        # Optional: Log conflict event in DB
        await log_event(project_id, "CONFLICT_DETECTED", {"blockId": target_block, "action": resolution})

    # 6. Run Execution Layer (Agents) + Save Jobs to DB
    execution_results = []
    for step in execution_plan:
        retries = 0
        step_success = False
        result = None
        
        while safety_layer.allow_retry(step, retries):
            result = execute_step(step, target_block, affected)
            if result.get("status") == "success" or result.get("status") == "pending_approval":
                step_success = True
                break
            retries += 1
            
        if not step_success:
            result = {"status": "failed", "reason": "retry limit exceeded"}
            
        execution_results.append({
            "step": step,
            "result": result
        })
        await save_job_run(run_id, target_block, step)

    # 7. Store result in memory
    memory_store.add_entry({
        "block": target_block,
        "mode": mode,
        "decision": decision,
        "execution_result": execution_results
    })

    # 8. Return combined result
    return {
        "block": target_block,
        "affected_blocks": affected,
        "mode": mode,
        "decision": decision,
        "execution_plan": execution_plan,
        "conflict": conflict_result,
        "execution_results": execution_results
    }