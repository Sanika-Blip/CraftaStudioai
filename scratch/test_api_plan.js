async function testPlanApi() {
  try {
    const res = await fetch('http://localhost:3004/api/plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-token'
      },
      body: JSON.stringify({
        prompt: '[MOD:plan] [MODEL:sarvam] Create a task manager',
        project_name: 'Test Project'
      })
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    if (res.ok) {
        console.log('Success! Plan title:', data.title);
        console.log('Blocks count:', data.blocks.length);
    } else {
        console.log('Error:', data);
    }
  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}

testPlanApi();
