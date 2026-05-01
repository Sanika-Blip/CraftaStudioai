import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv(dotenv_path='../backend/.env')

api_key = os.getenv("GROQ_API_KEY")
print(f"API Key found: {api_key is not None}")

if api_key:
    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Say hello"}],
            max_tokens=10
        )
        print("Groq API test successful!")
        print(f"Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"Groq API test failed: {e}")
else:
    print("No GROQ_API_KEY found")