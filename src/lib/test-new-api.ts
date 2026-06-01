/* eslint-disable */
import fs from 'fs';
import path from 'path';

const API_URL = 'https://api.sisprotgf.com/api/public/contracts/?status=16,19&remove_pagination=True&cycle=10&page=1&provisional=True&client_type=1,2';
const API_KEY = 'xK9pW2vM4zY0nR1tQ5sJ8hF3cD6aB1uE9iO2mN7rT4bV5xS8gL';

async function testFetch() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }
    const data = await res.json() as any;
    const dest = path.join(process.cwd(), 'new_api_response.json');
    fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf-8');
    console.log('✅ API payload fetch successful! Saved first contract entry to new_api_response.json');
    console.log('Sample contract payload structure:');
    const firstResult = data.results ? data.results[0] : data[0];
    console.log(JSON.stringify(firstResult, null, 2));
  } catch (error: any) {
    console.error('❌ Failed fetch API:', error.message);
  }
}

testFetch();
