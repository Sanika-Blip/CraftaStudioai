class ReviewAgent:
    def run(self, block_id: str, affected_blocks: list) -> dict:
        print(f"[Review] Reviewing changes for {block_id}")
        return {
            "status": "approved",
            "issues": []
        }
