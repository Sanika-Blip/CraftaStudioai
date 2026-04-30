import re

def detect_block(user_input: str) -> str:
    """Finds the core entity name from the prompt using keyword matching."""
    # Clean the input and split words
    words = re.findall(r'\b\w+\b', user_input.lower())
    
    # Words to ignore (actions/common fillers)
    ignore = {"update", "create", "delete", "make", "fix", "change", "add", "the", "a", "an", "model", "ui", "api"}
    
    # The first word that isn't an action is usually our 'Block'
    filtered = [w for w in words if w not in ignore]
    
    # Simple mapping for common terms
    mapping = {
        "user": "user-model",
        "auth": "auth-service",
        "stripe": "payment-gateway"
    }
    
    base_name = filtered[0] if filtered else "default-block"
    return mapping.get(base_name, base_name)
