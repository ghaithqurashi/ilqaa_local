(function () {
    'use strict';

    console.log('🔧 Initializing AppConfig...');

    // Detect environment - SIMPLIFIED LOGIC
    const hostname = window.location.hostname;
    
    // Production detection (same as in app.js)
    const isProduction = hostname !== 'localhost' && 
                        hostname !== '127.0.0.1' &&
                        !hostname.startsWith('192.168.') &&
                        !hostname.includes('.local');

    // Check if we're on Firebase Hosting
    const isFirebase = hostname.includes('.web.app') ||
        hostname.includes('.firebaseapp.com');

    // Production configuration
    const PRODUCTION_BACKEND_URL = 'https://ilqaa-backend-daz3lqejeq-uc.a.run.app';

    // Configuration
    window.AppConfig = {
        isProduction: isProduction,  // ← Use the simplified logic
        isFirebase: isFirebase,
        isLocal: !isProduction,  // Local is the opposite of production

        getBackendUrl: function () {
            if (this.isProduction) {
                // Production - use Cloud Run URL
                return PRODUCTION_BACKEND_URL;
            }
            // Local development
            return 'http://localhost:8000';
        },

        getWebSocketUrl: function (path, params = {}) {
            const backendUrl = this.getBackendUrl();

            // Determine protocol based on backend URL
            let wsUrl;
            if (backendUrl.startsWith('https://')) {
                wsUrl = 'wss://' + backendUrl.substring(8); // Remove https://
            } else {
                wsUrl = 'ws://' + backendUrl.substring(7); // Remove http://
            }

            // Remove trailing slash and add path
            wsUrl = wsUrl.replace(/\/$/, '') + path;

            // Add query parameters
            if (params && Object.keys(params).length > 0) {
                const queryString = new URLSearchParams(params).toString();
                wsUrl += '?' + queryString;
            }

            console.log('🔗 WebSocket URL:', wsUrl);
            return wsUrl;
        },

        getApiUrl: function (path) {
            const baseUrl = this.getBackendUrl();
            return baseUrl.replace(/\/$/, '') + path;
        }
    };

    // Alias for backward compatibility
    window.appConfig = window.AppConfig;

    console.log('✅ AppConfig initialized');
    console.log('🌍 Environment:', window.AppConfig.isProduction ? 'Production' : 'Development');
    console.log('🔧 Backend URL:', window.AppConfig.getBackendUrl());
    console.log('🔧 Hostname:', hostname);
})();