import time
import logging

logger = logging.getLogger(__name__)

class ExecutionSafety:
    def __init__(self):
        self.execution_history = {}
        self.last_trigger_times = {}

    def check_loop(self, run_id: str, max_steps: int = 10) -> bool:
        """Prevents an infinite loop within a single workflow run."""
        count = self.execution_history.get(run_id, 0)
        if count >= max_steps:
            return False
        
        self.execution_history[run_id] = count + 1
        return True

    def is_duplicate(self, block_id: str, recent_blocks: list) -> bool:
        """Guards against executing the same block immediately again."""
        if block_id in recent_blocks:
            return True
        return False

    def allow_retry(self, step: str, retries: int, max_retries: int = 3) -> bool:
        """Limits the number of times a single execution step can retry."""
        if retries >= max_retries:
            return False
        return True

    def allow_event(self, event_key: str, current_time: float, cooldown: int = 5) -> bool:
        """Simple rate limiting to prevent rapid event triggering."""
        last_time = self.last_trigger_times.get(event_key, 0)
        if (current_time - last_time) > cooldown:
            self.last_trigger_times[event_key] = current_time
            return True
        return False

# Global singleton instance
safety_layer = ExecutionSafety()
