from agents.types_.context import SharedContext
from agents.utils.llm_client import ai, langfuse

def refactor_node(state: SharedContext):
    """
    Refactor Agent: Improves code quality and applies user-requested edits.
    """
    span = langfuse.span(name="Refactor Loop", trace_id=state.trace_id)
    
    # SYSTEM PROMPT: Strict instructions to be surgical
    system_prompt = """
    You are a Refactoring Expert. 
    1. Only modify code blocks identified by // filename:
    2. Respect all SAFE MARKERS. Never delete code between # [SAFE_START] and # [SAFE_END].
    3. Goals: Improve readability, simplify logic, and apply user's new request.
    """
    
    # User Edit Request + Existing Code
    # Note: Using getattr to avoid crash if field is missing
    user_prompt = getattr(state, "user_edit_prompt", "Optimize code structure")
    refactor_request = f"User Request: {user_prompt}\n\nExisting Code:\n{state.generated_code}"
    
    try:
        response = ai.call(system_prompt=system_prompt, user_message=refactor_request)
        
        # Update state with the refined code
        state.generated_code = response['text']
        state.loop_count += 1
        
        span.end(output={"refactor_status": "complete"})
    except Exception as e:
        span.end(level="ERROR", status_message=str(e))
        raise e
        
    return state