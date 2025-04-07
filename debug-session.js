// Script to debug session issues
import fetch from 'node-fetch';

async function debugSessionIssue() {
  console.log('Debugging session cookie issues with various fetch options...');
  
  // Attempt login with different fetch options
  try {
    // 1. Standard login with default options
    console.log('\n---- TEST 1: Standard login with default options ----');
    const loginResponse1 = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });
    
    console.log('Response status:', loginResponse1.status);
    console.log('Response headers:');
    loginResponse1.headers.forEach((value, name) => {
      console.log(`${name}: ${value}`);
    });
    
    // 2. Login with credentials option (allows cookies to be stored/sent)
    console.log('\n---- TEST 2: Login with credentials option ----');
    const loginResponse2 = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
      credentials: 'include',
    });
    
    console.log('Response status:', loginResponse2.status);
    console.log('Response headers:');
    loginResponse2.headers.forEach((value, name) => {
      console.log(`${name}: ${value}`);
    });
    
    // Save any cookies received in the login response
    const cookies = loginResponse2.headers.get('set-cookie');
    console.log('\nCookies received:', cookies || 'None');
    
    // If we got cookies, attempt to access the user API with them
    if (cookies) {
      console.log('\n---- TEST 3: Accessing /api/user with cookies ----');
      const userResponse = await fetch('http://localhost:5000/api/user', {
        headers: {
          'Cookie': cookies,
        },
        credentials: 'include',
      });
      
      console.log('User response status:', userResponse.status);
      if (userResponse.ok) {
        console.log('User info:', await userResponse.json());
      } else {
        console.log('Failed to get user info:', await userResponse.text());
      }
    }
    
    // 3. Direct curl command for comparison
    console.log('\n---- TEST 4: Recommended curl command for manual testing ----');
    console.log('Try running this curl command to see if cookies are returned:');
    console.log('curl -v -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin123"}\'');
    
  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

debugSessionIssue();