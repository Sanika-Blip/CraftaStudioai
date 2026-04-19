import json
from agents.utils.llm_client import ai
from agents.types_.context import SharedContext
from .prompts import ARCHITECT_SYSTEM_PROMPT
from .schema_parser import parse_planner_output 

def run_planner(state: SharedContext) -> dict:
    """
    Transforms requirements into a blueprint while enforcing memory constraints.
    """
    print(f"[PLANNER] 🧠 Architecting: {state.project}")

    # Ensure memory is readable even if empty
    memory_snapshot = state.memory if state.memory else {"info": "No past constraints found."}

    user_message = f"""
    PROJECT NAME: {state.project}
    USER REQUEST: {state.user_edit_request or "Initial system build."}
    
    PAST CONSTRAINTS (Strictly Follow These):
    {json.dumps(memory_snapshot, indent=2)}
    """

    try:
        response = ai.call(
            system_prompt=ARCHITECT_SYSTEM_PROMPT,
            user_message=user_message
        )

        # Handle potential empty text from mock or failed calls
        raw_text = response.get("text", "{}")
        if not raw_text.strip().startswith("{"):
             raise ValueError("LLM returned non-JSON output.")

        plan_data = json.loads(raw_text)
        
        # 🔥 The Schema Parser ensures fields like 'tech_stack' become Pydantic objects
        clean_data = parse_planner_output(plan_data)
        
        return {
            **clean_data,
            "status": "planned"
        }

    except Exception as e:
        print(f"[PLANNER] ❌ Planning Failed: {str(e)}")
        return {"status": "failed"}