from agents.types_.context import SharedContext
from agents.planner.planner_agent import run_planner

def planner_node(state: SharedContext):
    """Entry point for the Planner in the LangGraph workflow."""
    print(f"[NODE] 📋 Starting Planner Node for project: {state.project}")
    
    # Run the planning logic
    updates = run_planner(state)
    
    # Update the SharedContext fields
    # LangGraph expects a dictionary or the updated state object back
    state.tech_stack = updates.get("tech_stack", state.tech_stack)
    state.conventions = updates.get("conventions", state.conventions)
    state.entities = updates.get("entities", state.entities)
    state.status = updates.get("status", "planned")
    
    return state