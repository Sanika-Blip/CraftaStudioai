import json
from agents.utils.llm_client import ai  
from ..context import MemoryItem

def extract_observational(user_input: str, trace_id: str) -> list[MemoryItem]:
    """Extracts patterns, habits, and preferences."""
    prompt_path = "agents/memory_layer/prompts/observational_prompt.txt"
    
    # 🔥 FIX: Initialize with a fallback
    system_prompt = "Analyze the user input for coding preferences and habits."

    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            system_prompt = f.read()
    except FileNotFoundError:
        print(f"[MEMORY] ⚠️ Observational prompt missing at {prompt_path}. Using fallback.")

    try:
        response = ai.call(
            system_prompt=system_prompt,
            user_message=f"User Input to analyze: {user_input}"
        )
        
        raw_text = response.get("text", "{\"items\": []}")
        data = json.loads(raw_text)

        return [MemoryItem(**item) for item in data.get("items", [])]
    except Exception as e:
        print(f"[MEMORY] ❌ Observational Extraction Error: {str(e)}")
        return []