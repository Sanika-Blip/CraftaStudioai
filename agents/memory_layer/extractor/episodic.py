import json
from agents.utils.llm_client import ai 
from ..context import MemoryItem

def extract_episodic(execution_logs: str, trace_id: str) -> list[MemoryItem]:
    """Captures events, errors, and milestones."""
    
    # 1. Initialize the variable so it's defined even if loading fails
    system_prompt = "You are a memory agent. Extract milestones from logs." 
    
    try:
        # 2. Try to load your custom prompt file
        with open("agents/memory_layer/prompts/episodic_prompt.txt", "r") as f:
            system_prompt = f.read()
    except FileNotFoundError:
        print("[MEMORY] ⚠️ episodic_prompt.txt not found, using default.")

    # 3. Call the AI
    try:
        response = ai.call(
            system_prompt=system_prompt, 
            user_message=f"Trace ID: {trace_id}\nLogs: {execution_logs}"
        ) 
        
        # Parse the JSON from the 'text' field of your AI response
        raw_text = response.get("text", "{}")
        data = json.loads(raw_text)
        return [MemoryItem(**item) for item in data.get("items", [])]
        
    except Exception as e:
        print(f"[MEMORY] ❌ Episodic Extraction failed: {e}")
        return []