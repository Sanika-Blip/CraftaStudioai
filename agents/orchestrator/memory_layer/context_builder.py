def build_memory_context(memory_entries: list) -> str:
    """
    Builds a simple string summary of recent changes from memory entries.
    Example output: 'Recent changes: user-model modified, payment-api modified'
    """
    if not memory_entries:
        return "No recent changes in memory."
        
    blocks_changed = [entry.get("block") for entry in memory_entries if entry.get("block")]
    
    if not blocks_changed:
        return "No recent changes in memory."
        
    summary = ", ".join([f"{block} modified" for block in blocks_changed])
    return f"Recent changes: {summary}"
