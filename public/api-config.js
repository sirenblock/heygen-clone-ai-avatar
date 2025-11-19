// API Configuration
// Update this with your backend API URL when deployed

const API_CONFIG = {
    // For local development
    local: 'http://localhost:8000',

    // For production - update with your actual backend URL
    // This could be:
    // - A separate backend deployment (Railway, Render, etc.)
    // - AWS Lambda/API Gateway
    // - Google Cloud Functions
    // - Your own server
    production: 'https://api.yourdomain.com',

    // Get the appropriate URL based on environment
    get baseUrl() {
        return window.location.hostname === 'localhost'
            ? this.local
            : this.production;
    }
};

// Export for use in other scripts
window.API_CONFIG = API_CONFIG;
