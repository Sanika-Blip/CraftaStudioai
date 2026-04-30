class ConflictDetector:
    def detect(self, block_id: str, memory_entries: list) -> list:
        """
        Finds past memory entries for the same block to detect potential conflicts.
        """
        conflicts = []
        for entry in memory_entries:
            if entry.get("block") == block_id:
                conflicts.append(entry)
        return conflicts

def resolve_conflict(conflicts: list) -> dict:
    """
    Decides the conflict resolution action based on the number of past modifications.
    """
    if not conflicts:
        return {
            "has_conflict": False,
            "action": "proceed"
        }

    # simple rule: if modified twice or more before, force a review
    if len(conflicts) >= 2:
        return {
            "has_conflict": True,
            "action": "review_required"
        }

    # warning if modified once before
    return {
        "has_conflict": True,
        "action": "warning"
    }
