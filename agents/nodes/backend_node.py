from agents.types_.context import SharedContext
from agents.utils.llm_client import ai, langfuse 
from agents.utils.prompt_engine import build_prompt
from agents.utils.database import update_db_and_status

def backend_node(state: SharedContext) -> SharedContext:
    # ... Tracing logic remains same ...
    trace = langfuse.trace(name=f"Project: {state.project}", id=state.trace_id)
    span = trace.span(name="Backend Generation")

    update_db_and_status(run_id=state.project, status="running")
    print(f"\n[NODE: BACKEND] 🚀 Writing code based on Plan...")

    system_prompt = build_prompt("backend_agent", state)
    
    # 🔥 FIX: Force the user request to include the specific Tech Stack from the Planner
    user_request = (
        f"ACT AS A SENIOR DEVELOPER. You MUST use this stack: {state.tech_stack}. "
        f"Follow these conventions: {state.conventions}. "
        f"Create TypeScript code for routes: {list(state.api_routes.keys()) if state.api_routes else ['default']}. "
        f"Referencing entities: {list(state.entities.keys()) if state.entities else ['default']}."
    )

    try:
        response = ai.call(
            system_prompt=system_prompt,
            user_message=user_request
        )

        # Clear code on first attempt, append on retry
        if state.loop_count == 0:
            state.generated_code = f"/* Project: {state.project} */\n"
        
        new_code = f"\n/* Iteration {state.loop_count} */\n{response['text']}"
        state.generated_code = new_code # Replace with fresh code each loop

        state.token_usage["input"] += response.get("input_tokens", 0)
        state.token_usage["output"] += response.get("output_tokens", 0)

        update_db_and_status(run_id=state.project, status="running", code=state.generated_code)
        span.end(output={"tokens_used": response.get("output_tokens", 0)})

    except Exception as e:
        print(f"[NODE: BACKEND] ❌ Error: {str(e)}")
        state.risk_level = "high"
        span.end(level="ERROR", status_message=str(e))

    return state