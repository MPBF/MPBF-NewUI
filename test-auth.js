// Simple test script to verify login API with cookie handling
import fetch from 'node-fetch';

async function testAuth() {
  console.log('Testing authentication...');
  let sessionCookie = '';
  
  try {
    // Test login
    console.log('Testing login with admin user...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });
    
    // Get cookies from response headers
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('Received cookies:', setCookieHeader);
      
      // Extract just the session cookie part (before first semicolon)
      const cookieParts = setCookieHeader.split(';');
      sessionCookie = cookieParts[0];
      console.log('Extracted session cookie:', sessionCookie);
    } else {
      console.log('No cookies received from login');
    }
    
    if (loginResponse.ok) {
      const userData = await loginResponse.json();
      console.log('Login successful!');
      console.log('User data:', userData);
      
      if (sessionCookie) {
        // Test fetching user info with the session cookie
        console.log('\nTesting /api/user endpoint with session cookie...');
        const userResponse = await fetch('http://localhost:5000/api/user', {
          headers: {
            'Cookie': sessionCookie
          }
        });
        
        console.log('User response status:', userResponse.status);
        console.log('User response headers:', Object.fromEntries(userResponse.headers.entries()));
        
        if (userResponse.ok) {
          const userInfo = await userResponse.json();
          console.log('User info fetch successful!');
          console.log('User info:', userInfo);
        } else {
          console.error('Failed to fetch user info:', await userResponse.text());
        }
        
        // Test logout
        console.log('\nTesting logout with session cookie...');
        const logoutResponse = await fetch('http://localhost:5000/api/logout', {
          method: 'POST',
          headers: {
            'Cookie': sessionCookie
          }
        });
        
        if (logoutResponse.ok) {
          console.log('Logout successful!');
        } else {
          console.error('Failed to logout:', await logoutResponse.text());
        }
      } else {
        console.log('Skipping user info and logout tests because no session cookie was received');
      }
      
    } else {
      console.error('Login failed:', await loginResponse.text());
    }
    
  } catch (error) {
    console.error('Error during authentication test:', error);
  }
}

testAuth();