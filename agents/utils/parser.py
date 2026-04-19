import re
import os

def parse_and_write_files(text: str):
    """
    AI-10: Robust 'Carving' Logic.
    """
    # This pattern ignores leading whitespace and captures everything until the next marker or end of string
    pattern = r"//\s*filename:\s*(.+?)\s*\n([\s\S]*?)(?=\n\s*//\s*filename:|$)"
    
    matches = re.findall(pattern, text)
    
    if not matches:
        print("[MERGE ENGINE] ❌ No valid file blocks were detected.")
        return False

    for filename, content in matches:
        path = filename.strip()
        # Clean up code fences if the AI included them
        clean_content = re.sub(r"^```[a-z]*\n", "", content, flags=re.I)
        clean_content = re.sub(r"\n```$", "", clean_content)
        
        directory = os.path.dirname(path)
        if directory:
            os.makedirs(directory, exist_ok=True)
        
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(clean_content.strip())
                print(f"   📂 Created/Updated: {path}")
        except Exception as e:
            print(f"   ❌ Failed to write {path}: {str(e)}")
            return False
            
    return True

