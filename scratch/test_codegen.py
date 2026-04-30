from agents.nodes.codegen_agent import CodeGenAgent

print("\n--- TEST 1: user-model ---")
agent = CodeGenAgent()
res1 = agent.run("user-model", [])
print(res1)

print("\n--- TEST 2: auth-api ---")
res2 = agent.run("auth-api", [])
print(res2)

print("\n--- TEST 3: user-db ---")
res3 = agent.run("user-db", [])
print(res3)

# Test overwrite protection
print("\n--- TEST 4: user-model (again) ---")
res4 = agent.run("user-model", [])
print(res4)
