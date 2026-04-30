import logging
from agents.nodes.codegen_agent import CodeGenAgent
from agents.nodes.review_agent import ReviewAgent

logger = logging.getLogger(__name__)

def approval_step(block_id: str) -> dict:
    print(f"[Approval] Manual approval required for {block_id}")
    return {"status": "pending_approval"}

def execute_step(step: str, block_id: str, affected_blocks: list) -> dict:
    """
    Executes a single step using the actual agent logic.
    """
    if step == "codegen":
        result = CodeGenAgent().run(block_id, affected_blocks)
        return result
    elif step == "review":
        result = ReviewAgent().run(block_id, affected_blocks)
        return result
    elif step == "approval":
        return approval_step(block_id)
    else:
        logger.warning(f"Unknown execution step: {step}")
        return {"status": "error", "message": f"Unknown step: {step}"}

def run_execution_plan(plan: list, block_id: str, affected_blocks: list) -> list:
    """
    Executes a list of steps in order and collects the results.
    """
    results = []
    
    if not plan:
        print("Execution plan is empty. Nothing to run.")
        return results

    for step in plan:
        result = execute_step(step, block_id, affected_blocks)
        results.append({
            "step": step,
            "result": result
        })
        
    return results
