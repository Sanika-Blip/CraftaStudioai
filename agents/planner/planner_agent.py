from agents.utils.llm_client import ai
from agents.types_.context import SharedContext
from .prompts import load_prompt


def run_planner(state: SharedContext) -> dict:
    """
    Planner AI → Generates Software Design Document (SDD) in Markdown.
    """

    print(f"[PLANNER] 🧠 Generating SDD for: {state.project}")

    # Load correct prompt
    planner_prompt = load_prompt("planner_system.txt")

    # Memory fallback
    memory_snapshot = state.memory if state.memory else {"info": "No past constraints found."}

    # Construct user input
    user_message = f"""
PROJECT NAME: {state.project}

USER REQUEST:
{state.user_edit_request or "Initial system build."}

PAST CONSTRAINTS:
{memory_snapshot}
"""

    try:
        response = ai.call(
            system_prompt=planner_prompt,
            user_message=user_message
        )

        sdd_output = response.get("text", "").strip()

        if not sdd_output:
            raise ValueError("Empty response from LLM")

        return {
            "sdd": sdd_output,
            "status": "planned"
        }

    except Exception as e:
        print(f"[PLANNER] ❌ Planning Failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e)
        }