from .deterministic import extract_deterministic
from .observational import extract_observational
from .episodic import extract_episodic
from ..context import MemoryState

def run_full_extraction(user_input: str, trace_id: str) -> MemoryState:
    """
    🔥 The Global Memory Agent Logic.
    Runs all extractors and compiles the Tri-Layer Memory.
    """
    print(f"[MEMORY] 🧠 Extracting intelligence for Trace: {trace_id}")
    
    return MemoryState(
        deterministic=extract_deterministic(user_input, trace_id),
        observational=extract_observational(user_input, trace_id),
        episodic=extract_episodic(user_input, trace_id)
    )