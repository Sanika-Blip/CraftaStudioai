from pathlib import Path

def load_prompt(file_name: str) -> str:
    """
    Loads prompt text from prompts directory.
    """
    prompt_path = Path(__file__).parent.parent / "prompts" / file_name

    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()