import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDKUkLc7FmMxg9Aa-sLULtCUMxM5K57YPs",
    authDomain: "ilqaa-402a3.firebaseapp.com",
    projectId: "ilqaa-402a3",
    storageBucket: "ilqaa-402a3.firebasestorage.app",
    messagingSenderId: "373887053122",
    appId: "1:373887053122:web:d0535f5cb30670ea50acdb"
};

console.log('🔥 Firebase Config loaded');

// Initialize Firebase
let app;
let auth;
let googleProvider;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();

    console.log('✅ Firebase App initialized');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
}

// Set persistence - LOCAL for "remember me" across browser sessions
async function initializeAuth() {
    try {
        await setPersistence(auth, browserLocalPersistence);
        console.log('✅ Auth persistence set to LOCAL');
    } catch (error) {
        console.error('❌ Error setting auth persistence:', error);
        // Fallback to session persistence
        try {
            await setPersistence(auth, browserSessionPersistence);
            console.log('✅ Auth persistence set to SESSION (fallback)');
        } catch (fallbackError) {
            console.error('❌ Could not set any persistence:', fallbackError);
        }
    }
}

// Initialize auth persistence
initializeAuth();

// Auth state listener - tracks user login/logout
onAuthStateChanged(auth, (user) => {
    const userEmail = user ? user.email : 'No user';
    console.log(`👤 Auth state changed: ${userEmail}`);

    // Store user globally
    window.currentUser = user;

    // Dispatch custom event so other parts of app can react
    const event = new CustomEvent('authStateChanged', {
        detail: {
            user: user,
            isAuthenticated: !!user
        }
    });
    window.dispatchEvent(event);
});

// Login function
async function loginWithGoogle() {
    try {
        console.log('🔐 Starting Google login...');
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        console.log('✅ Login successful:', {
            email: user.email,
            uid: user.uid,
            displayName: user.displayName
        });

        return {
            success: true,
            user: user,
            token: await user.getIdToken()
        };
    } catch (error) {
        console.error('❌ Login error:', error);

        // Handle specific errors
        let errorMessage = 'Login failed';
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Login cancelled by user';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup blocked by browser. Please allow popups for this site.';
        }

        return {
            success: false,
            error: errorMessage,
            code: error.code
        };
    }
}

// Logout function
async function logout() {
    try {
        console.log('👋 Logging out...', new Error().stack); // Add stack trace
        await signOut(auth);
        console.log('✅ Logout successful');
        return { success: true };
    } catch (error) {
        console.error('❌ Logout error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Check if user is logged in (synchronous)
function isLoggedIn() {
    return !!auth.currentUser;
}

// Get current user (synchronous)
function getCurrentUser() {
    return auth.currentUser;
}

// Get auth instance
function getAuthInstance() {
    return auth;
}

// Wait for auth to be ready (returns promise)
function waitForAuth() {
    return new Promise((resolve) => {
        // If auth already has a user, return immediately
        if (auth.currentUser) {
            resolve(auth.currentUser);
            return;
        }

        // Otherwise wait for auth state change
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

// Get ID token for backend API calls
async function getIdToken() {
    if (!auth.currentUser) return null;
    try {
        return await auth.currentUser.getIdToken();
    } catch (error) {
        console.error('❌ Error getting ID token:', error);
        return null;
    }
}

// Verify user is allowed (check against backend)
async function verifyUserWithBackend() {
    try {
        console.log('🔐 Starting backend verification...');
        const token = await getIdToken();
        console.log('🔐 Firebase ID Token:', token ? 'Present' : 'Missing');

        if (!token) {
            console.log('❌ No authentication token');
            return { allowed: false, reason: 'No authentication token' };
        }

        const backendUrl = window.appConfig?.getBackendUrl();
        console.log('🔐 Backend URL:', backendUrl);

        // Step 1: Login with Firebase token to get session token
        console.log('🔐 Step 1: Getting session token from backend...');
        const loginResponse = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: token })
        });

        console.log('🔐 Login response status:', loginResponse.status);

        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            console.log('❌ Login failed:', {
                status: loginResponse.status,
                statusText: loginResponse.statusText,
                body: errorText
            });
            return {
                allowed: false,
                reason: 'Login failed',
                status: loginResponse.status,
                details: errorText
            };
        }

        const loginData = await loginResponse.json();
        console.log('✅ Login successful:', loginData);

        // Step 2: Verify the session token (optional but good for validation)
        console.log('🔐 Step 2: Verifying session token...');
        const sessionToken = loginData.token;
        if (!sessionToken) {
            console.log('❌ No session token received from backend');
            return {
                allowed: false,
                reason: 'No session token received',
                data: loginData
            };
        }

        const verifyResponse = await fetch(`${backendUrl}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        console.log('🔐 Verify response status:', verifyResponse.status);

        if (!verifyResponse.ok) {
            const errorText = await verifyResponse.text();
            console.log('❌ Verification failed:', {
                status: verifyResponse.status,
                statusText: verifyResponse.statusText,
                body: errorText
            });
            return {
                allowed: false,
                reason: 'Verification failed',
                status: verifyResponse.status,
                details: errorText
            };
        }

        const verifyData = await verifyResponse.json();
        console.log('✅ Verification result:', verifyData);

        // Handle the response format
        return {
            allowed: verifyData.valid === true,
            reason: verifyData.error,
            user: verifyData.user,
            sessionToken: sessionToken,
            loginData: loginData,
            verifyData: verifyData
        };

    } catch (error) {
        console.error('❌ Backend verification error:', error);
        console.error('❌ Error details:', error.stack);

        return {
            allowed: false,
            reason: 'Connection error',
            error: error.message
        };
    }
}

// Export everything
window.firebaseAuth = {
    // Core functions
    loginWithGoogle,
    logout,
    isLoggedIn,
    getCurrentUser,
    getAuthInstance,
    waitForAuth,
    getIdToken,

    // Utility functions
    verifyUserWithBackend,

    // Constants
    auth, // The auth instance itself
    AUTH_EVENTS: {
        CHANGED: 'authStateChanged'
    }
};

console.log('✅ Firebase Auth module loaded and ready');

// Add this temporary function to firebase-auth.js
async function debugToken() {
    const user = auth.currentUser;
    if (!user) {
        console.log('❌ No user to debug');
        return;
    }

    try {
        const token = await user.getIdToken();
        console.log('🔍 Token debug:');
        console.log('🔍 Token length:', token.length);
        console.log('🔍 First 50 chars:', token.substring(0, 50) + '...');

        // Decode the token to see its contents
        const parts = token.split('.');
        if (parts.length === 3) {
            try {
                const payload = JSON.parse(atob(parts[1]));
                console.log('🔍 Token payload:', payload);
                console.log('🔍 Token issued at:', new Date(payload.iat * 1000));
                console.log('🔍 Token expires at:', new Date(payload.exp * 1000));
                console.log('🔍 Token email:', payload.email);
            } catch (e) {
                console.log('❌ Could not parse token payload:', e);
            }
        }
    } catch (error) {
        console.error('❌ Error getting token:', error);
    }
}

// Add to window for debugging
window.firebaseAuth.debugToken = debugToken;

// Add to firebase-auth.js
async function testTokenWithBackendManually() {
    try {
        const token = await getIdToken();
        if (!token) {
            console.log('❌ No token available');
            return;
        }

        const backendUrl = window.appConfig?.getBackendUrl();

        // Test 1: Send as Bearer token (current method)
        console.log('🔍 Test 1: Sending as Bearer token...');
        const response1 = await fetch(`${backendUrl}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('🔍 Bearer token response:', await response1.text());

        // Test 2: Send as JSON body
        console.log('🔍 Test 2: Sending as JSON body...');
        const response2 = await fetch(`${backendUrl}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: token })
        });
        console.log('🔍 JSON body response:', await response2.text());

        // Test 3: Simple GET to check if endpoint exists
        console.log('🔍 Test 3: Simple endpoint check...');
        const response3 = await fetch(`${backendUrl}/api/auth/verify`);
        console.log('🔍 Endpoint check:', response3.status, await response3.text());

    } catch (error) {
        console.error('❌ Token test error:', error);
    }
}

// Add to window
window.firebaseAuth.testTokenWithBackendManually = testTokenWithBackendManually;