from agents.types_.context import SharedContext

# --- PER-AGENT STEP LIMITS ---
# Total steps allowed across the whole swarm is 50
GLOBAL_LIMIT = 50

# Specific limits per agent role
AGENT_LIMITS = {
    "planner": 5,     # The planner should only run a few times
    "backend": 20,    # Matches backend_node (Claude)
    "reviewer": 15,   # Matches reviewer_node
    "documenter": 5,  
    "merge": 5        # Matches merge_node
}

def check_agent_budget(state: SharedContext, agent_name: str) -> tuple[bool, str]:
    """
    Section 4.10: Per-Agent Guardrail Layer.
    Verifies if a specific agent has exceeded its allocated quota.
    """
    if state.loop_count >= GLOBAL_LIMIT:
        return False, f"Global Swarm Limit ({GLOBAL_LIMIT}) reached."

    metadata = getattr(state, "metadata", {})
    agent_usage = metadata.get("agent_steps", {})
    current_agent_steps = agent_usage.get(agent_name, 0)
    
    limit = AGENT_LIMITS.get(agent_name.replace("_node", ""), 10) 
    
    if current_agent_steps >= limit:
        return False, f"Agent '{agent_name}' has reached its individual limit of {limit} steps."

    return True, "Proceed"

def increment_and_verify(state: SharedContext, agent_name: str) -> bool:
    """
    Increments the agent's step count and verifies the budget.
    """
    if not hasattr(state, "metadata"):
        state.metadata = {}
    if "agent_steps" not in state.metadata:
        state.metadata["agent_steps"] = {}
    if "step_tracking" not in state.metadata:
        state.metadata["step_tracking"] = {}

    state.loop_count += 1
    state.metadata["agent_steps"][agent_name] = state.metadata["agent_steps"].get(agent_name, 0) + 1
    state.metadata["step_tracking"][agent_name] = state.metadata["step_tracking"].get(agent_name, 0) + 1
    
    is_valid, msg = check_agent_budget(state, agent_name)
    if not is_valid:
        print(f"🛑 [GUARDRAIL] {msg}")
        return False
        
    return True