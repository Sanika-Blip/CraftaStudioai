# agents/utils/prompt_engine.py
import os
from agents.types_.context import SharedContext

def build_prompt(prompt_name: str, state: SharedContext) -> str:
    """
    Loads a .txt prompt and injects the current state.
    """
    # 1. Get the path to the prompts folder
    base_dir = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(base_dir, "prompts", f"{prompt_name}.txt")
    
    # 2. Read the expert instructions
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Prompt file {prompt_name}.txt not found.")
        
    with open(file_path, "r", encoding="utf-8") as f:
        system_instructions = f.read()

    # 3. Inject the current architectural 'Truth' into the prompt
    # This allows agents to see the blueprints created by the Planner
    context_data = state.model_dump_json(indent=2)
    
    full_prompt = (
        f"{system_instructions}\n\n"
        f"### CURRENT ARCHITECTURAL CONTEXT (THE TRUTH):\n"
        f"{context_data}\n\n"
        f"Generate your output based ONLY on the context above."
    )
    
    return full_prompt

