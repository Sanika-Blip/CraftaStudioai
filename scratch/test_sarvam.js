const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const key = process.env.SARVAM_API_KEY;
console.log('Key:', key ? key.slice(0, 10) + '...' : 'MISSING');

async function testSarvam() {
  if (!key) return;
  try {
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 
          'api-subscription-key': key,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          model: 'sarvam-2b',
          messages: [{ role: 'user', content: 'Hello' }]
      })
    });
    
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Sarvam failed: ${res.status} - ${text}`);
    }
    
    const data = await res.json();
    console.log('Sarvam OK:', data.choices[0].message.content);
  } catch (err) {
    console.error('Sarvam Error:', err.message);
  }
}

testSarvam();
