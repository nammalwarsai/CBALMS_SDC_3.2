const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const AuthModel = require('../src/models/authModel');

// Mock request/response isn't needed if we test the Model directly first
// But better to test the flow. LETS TEST MODEL FIRST.

async function testAuthFlow() {
    const email = `testuser${Math.floor(Math.random() * 10000)}@test.com`;
    const password = 'Password123!';

    console.log('1. Attempting Signup with:', email);
    const { data: signUpData, error: signUpError } = await AuthModel.signUp(email, password);

    if (signUpError) {
        console.error('Signup Failed:', signUpError.message);
        return;
    }
    console.log('Signup Successful. User ID:', signUpData.user?.id);

    console.log('2. Attempting Login with same credentials...');
    const { data: signInData, error: signInError } = await AuthModel.signIn(email, password);

    if (signInError) {
        console.error('Login Failed:', signInError.message);
        console.log('Tip: If the error is "Email not confirmed", you need to disable email confirmation in Supabase Dashboard -> Authentication -> Providers -> Email -> Confirm Emai or actually click the link.');
    } else {
        console.log('Login Successful!');
        console.log('Session Access Token:', signInData.session?.access_token ? 'Present' : 'Missing');
    }
}

testAuthFlow();
