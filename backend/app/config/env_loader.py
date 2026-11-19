import json
import os
from pathlib import Path
from dotenv import load_dotenv


def load_environment():
    """Load environment variables from appropriate .env file"""
    # Base directory
    base_dir = Path(__file__).parent.parent.parent
    
    # Determine which .env file to load
    env = os.getenv("ENVIRONMENT", "development")
    env_files = [
        base_dir / f".env.{env}",  # e.g., .env.development
        base_dir / ".env",         # Fallback to .env
    ]
    
    # Try to load environment files
    for env_file in env_files:
        if env_file.exists():
            print(f"📁 Loading environment from: {env_file}")
            load_dotenv(env_file, override=True)
            break
    else:
        print("⚠️  No .env file found, using system environment variables")
    
    # Print debug info
    print(f"🌍 Active environment: {env}")
    print(f"🏠 Backend host: {os.getenv('HOST', '127.0.0.1')}:{os.getenv('PORT', '8000')}")
    
    # Debug specific keys (show first few chars for verification)
    debug_keys = [
        'SPEECHMATICS_API_KEY', 
        'LLM_API_KEY', 
        'LLM_PROVIDER',
        'FIREBASE_API_KEY',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'JWT_SECRET'
    ]
    
    for key in debug_keys:
        value = os.getenv(key)
        if value:
            masked = value[:4] + "..." + value[-4:] if len(value) > 8 else "***"
            print(f"🔑 {key}: {masked}")
        else:
            print(f"🔑 {key}: [not set]")
    
    # Validate required Firebase variables
    required_firebase_vars = [
        'FIREBASE_API_KEY',
        'FIREBASE_AUTH_DOMAIN', 
        'FIREBASE_PROJECT_ID',
        'FIREBASE_STORAGE_BUCKET',
        'FIREBASE_MESSAGING_SENDER_ID',
        'FIREBASE_APP_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL',
        'ALLOWED_USERS',
        'JWT_SECRET'
    ]
    
    missing_vars = []
    for var in required_firebase_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  Warning: Missing required Firebase variables: {', '.join(missing_vars)}")
        print("   Authentication will not work properly without these.")
    else:
        print("✅ All required Firebase variables are set")
    
    # Parse allowed users
    allowed_users_str = os.getenv('ALLOWED_USERS', '')
    if allowed_users_str:
        try:
            parsed = json.loads(allowed_users_str)
            if isinstance(parsed, list):
                allowed_users = [email.strip() for email in parsed if isinstance(email, str) and email.strip()]
            else:
                # Fall back to comma-split if JSON is not a list
                allowed_users = [email.strip() for email in allowed_users_str.split(',') if email.strip()]
        except Exception:
            allowed_users = [email.strip() for email in allowed_users_str.split(',') if email.strip()]

        print(f"👥 Allowed users: {len(allowed_users)} user(s) configured")
    else:
        print("👥 Allowed users: [no users configured - only you can login]")