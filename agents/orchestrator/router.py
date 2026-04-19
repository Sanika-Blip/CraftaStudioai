from agents.types_.context import SharedContext

def orchestrator_router(state: SharedContext) -> str:
    """
    Decides the next node based on the quality and risk assessment 
    of the Reviewer Agent.
    """
    print(f"\n[ORCHESTRATOR] 🚦 Routing Turn: {state.loop_count}")

    # 1. Check for User Intervention (AI-09)
    if getattr(state, "user_edit_request", None):
        print("[ORCHESTRATOR] 🛠️ User request detected. Routing to REFACTOR.")
        return "refactor"

    # 2. Check for High Risk / Security Issues
    if state.risk_level == "high":
        if state.loop_count < 3:
            print(f"[ORCHESTRATOR] 🔄 Quality Low. Re-routing to GENERATOR (Attempt {state.loop_count}/3)")
            return "recode"
        else:
            print("[ORCHESTRATOR] ⚠️ Max loops reached. Proceeding despite high risk.")
            return "finalize"

    # 3. Success Path
    if state.status == "done" or state.risk_level == "low":
        print("[ORCHESTRATOR] ✅ Architecture & Code verified. Routing to MERGE.")
        return "finalize"

    # Default fallback
    return "finalize"