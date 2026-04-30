import time
from agents.orchestrator.safety import safety_layer

print("--- Testing Loop Protection ---")
for i in range(12):
    if safety_layer.check_loop("run_123"):
        print(f"Step {i+1} allowed.")
    else:
        print(f"Step {i+1} BLOCKED (Loop detected)")

print("\n--- Testing Duplicate Execution ---")
recent_blocks = ["user-model", "auth-api"]
print(f"user-model duplicate? {safety_layer.is_duplicate('user-model', recent_blocks)}")
print(f"payment-api duplicate? {safety_layer.is_duplicate('payment-api', recent_blocks)}")

print("\n--- Testing Retry Limit ---")
for r in range(5):
    if safety_layer.allow_retry("codegen", r):
        print(f"Retry {r} allowed.")
    else:
        print(f"Retry {r} BLOCKED (Max retries reached)")

print("\n--- Testing Event Rate Limiting ---")
print("Event 1 triggered at t=0")
allowed_1 = safety_layer.allow_event("proj_user-model", time.time(), cooldown=2)
print(f"Allowed? {allowed_1}")

print("Triggering Event 2 immediately...")
allowed_2 = safety_layer.allow_event("proj_user-model", time.time(), cooldown=2)
print(f"Allowed? {allowed_2}")

print("Waiting 3 seconds...")
time.sleep(3)
allowed_3 = safety_layer.allow_event("proj_user-model", time.time(), cooldown=2)
print(f"Allowed? {allowed_3}")
