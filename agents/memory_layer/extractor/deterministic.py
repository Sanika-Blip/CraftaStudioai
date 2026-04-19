import json
from agents.utils.llm_client import ai  
from ..context import MemoryItem

def extract_deterministic(user_input: str, trace_id: str) -> list[MemoryItem]:
    """Extracts hard architectural constraints."""
    prompt_path = "agents/memory_layer/prompts/deterministic_prompt.txt"
    
    # 🔥 FIX: Initialize with a fallback so it's NEVER undefined
    system_prompt = "Extract architectural constraints from the following input into JSON."

    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            system_prompt = f.read()
    except FileNotFoundError:
        print(f"[MEMORY] ⚠️ Deterministic prompt missing at {prompt_path}. Using fallback.")

    try:
        response = ai.call(
            system_prompt=system_prompt, 
            user_message=user_input
        ) 
        
        # Safe access to response text
        raw_text = response.get("text", "{\"items\": []}")
        data = json.loads(raw_text)

        return [MemoryItem(**item) for item in data.get("items", [])]
    except Exception as e:
        print(f"[MEMORY] ❌ Deterministic Extraction Error: {str(e)}")
        return []