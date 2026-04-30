import logging

logger = logging.getLogger(__name__)

def build_execution_plan(decision: dict, affected_blocks: list) -> list:
    """
    Dynamically decides the execution pipeline steps based on the AI decision and affected blocks.
    Uses rule-based mapping to convert a decision into a concrete action plan.
    """
    action = decision.get("recommended_action", "ignore").lower()
    risk = decision.get("risk_level", "low").lower()

    steps = []

    # Basic mapping
    if action == "ignore":
        return steps
    elif action == "regenerate":
        steps = ["codegen"]
    elif action == "review":
        steps = ["codegen", "review"]
    else:
        # Fallback for unrecognized actions
        steps = ["codegen", "review"]

    # Risk-based overrides
    if risk == "high":
        if "review" not in steps:
            steps.append("review")
        steps.append("approval")

    return steps

def execute_plan(plan: list):
    """
    Execution Runner placeholder.
    Simulates the execution of the pipeline.
    """
    if not plan:
        print("Execution plan is empty. Nothing to run.")
        return

    print("--- Starting Pipeline Execution ---")
    for step in plan:
        print(f"Running {step}...")
    print("--- Pipeline Execution Complete ---")
