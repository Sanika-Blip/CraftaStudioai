class MemoryStore:
    def __init__(self):
        self.memory = []

    def add_entry(self, entry: dict):
        self.memory.append(entry)

    def get_recent(self, limit: int = 5) -> list:
        return self.memory[-limit:] if self.memory else []
