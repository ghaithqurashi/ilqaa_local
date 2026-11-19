import os
import json
import firebase_admin
from firebase_admin import auth, credentials
from firebase_admin.exceptions import FirebaseError
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Global flag and instance
_firebase_initialized = False

def initialize_firebase():
    """Initialize Firebase Admin SDK with credentials"""
    global _firebase_initialized
    
    try:
        # Check if already initialized
        if not firebase_admin._apps:
            # Get credentials from environment variables
            private_key = os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n')
            client_email = os.getenv('FIREBASE_CLIENT_EMAIL', '')
            project_id = os.getenv('FIREBASE_PROJECT_ID', '')
            
            if not private_key or not client_email:
                logger.error("Firebase credentials not found in environment variables")
                logger.error(f"Private key exists: {bool(private_key)}")
                logger.error(f"Client email exists: {bool(client_email)}")
                return False
            
            # Create credentials dictionary
            cred_dict = {
                "type": "service_account",
                "project_id": project_id,
                "private_key_id": "",  # Not strictly required for initialization
                "private_key": private_key,
                "client_email": client_email,
                "client_id": "",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{client_email}"
            }
            
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("✅ Firebase Admin SDK initialized successfully")
            return True
        else:
            _firebase_initialized = True
            return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize Firebase Admin SDK: {str(e)}")
        return False

class FirebaseAuth:
    def __init__(self):
        self.jwt_secret = os.getenv('JWT_SECRET', 'fallback-secret-change-this')
        # Don't load allowed_users here - load fresh each time
    
    def _get_allowed_users(self):
        """Parse allowed users from environment variable - fresh each time"""
        allowed_users_str = os.getenv('ALLOWED_USERS', '')
        if not allowed_users_str:
            return []

        # If the env var is a JSON array string, parse it
        try:
            parsed = json.loads(allowed_users_str)
            if isinstance(parsed, list):
                return [email.strip().lower() for email in parsed if isinstance(email, str) and email.strip()]
        except Exception:
            # Not JSON - fall back to comma-separated parsing
            pass

        # Comma-separated list
        users = [email.strip().lower() for email in allowed_users_str.split(',') if email.strip()]
        return users
    
    def _ensure_firebase_initialized(self):
        """Ensure Firebase is initialized before using it"""
        global _firebase_initialized
        if not _firebase_initialized:
            if not initialize_firebase():
                raise RuntimeError("Firebase not initialized")
        return True
    
    def verify_id_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        """Verify Firebase ID token and return user info"""
        try:
            # Ensure Firebase is initialized
            self._ensure_firebase_initialized()
            
            # Verify the Firebase ID token
            decoded_token = auth.verify_id_token(id_token)
            
            # Get user email
            user_email = decoded_token.get('email', '').lower()
            user_id = decoded_token.get('uid', '')
            
            if not user_email:
                logger.warning(f"No email found in token for user {user_id}")
                return None
            
            # Get fresh allowed users list
            allowed_users = self._get_allowed_users()
            
            # DEBUG
            logger.info(f"🔐 Auth Check: User={user_email}")
            logger.info(f"🔐 Auth Check: Allowed={allowed_users}")
            logger.info(f"🔐 Auth Check: User allowed?={user_email in allowed_users}")
            
            # Check if user is in allowed list
            if allowed_users and user_email not in allowed_users:
                logger.warning(f"🚫 User {user_email} is NOT in allowed users list")
                logger.warning(f"🚫 Allowed users: {allowed_users}")
                return None
            
            logger.info(f"✅ User {user_email} is authorized to login")
            
            # Return user information
            return {
                'uid': user_id,
                'email': user_email,
                'name': decoded_token.get('name', ''),
                'picture': decoded_token.get('picture', ''),
                'email_verified': decoded_token.get('email_verified', False),
                'issuer': decoded_token.get('iss', ''),
                'audience': decoded_token.get('aud', ''),
                'issued_at': decoded_token.get('iat', 0),
                'expires_at': decoded_token.get('exp', 0)
            }
            
        except ValueError as e:
            logger.error(f"Invalid token format: {str(e)}")
            return None
        except FirebaseError as e:
            logger.error(f"Firebase authentication error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during token verification: {str(e)}")
            return None
    
    def create_session_token(self, user_info: Dict[str, Any]) -> str:
        """Create a JWT session token for the user"""
        try:
            # Set token expiration (24 hours)
            expiration = datetime.utcnow() + timedelta(hours=24)
            
            # Create payload
            payload = {
                'sub': user_info['uid'],
                'email': user_info['email'],
                'name': user_info.get('name', ''),
                'exp': expiration,
                'iat': datetime.utcnow(),
                'iss': 'ilqaa-backend'
            }
            
            # Generate JWT token
            token = jwt.encode(payload, self.jwt_secret, algorithm='HS256')
            return token
            
        except Exception as e:
            logger.error(f"Error creating session token: {str(e)}")
            raise
    
    def verify_session_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT session token"""
        try:
            # Verify and decode token
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            
            # Get fresh allowed users list
            allowed_users = self._get_allowed_users()
            
            # Check if user is still allowed
            user_email = payload.get('email', '').lower()
            if allowed_users and user_email not in allowed_users:
                logger.warning(f"User {user_email} is no longer in allowed users list")
                return None
            
            return {
                'uid': payload['sub'],
                'email': user_email,
                'name': payload.get('name', ''),
                'exp': payload.get('exp'),
                'iss': payload.get('iss')
            }
            
        except jwt.ExpiredSignatureError:
            logger.warning("Session token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid session token: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error verifying session token: {str(e)}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email (admin function)"""
        try:
            self._ensure_firebase_initialized()
            user = auth.get_user_by_email(email)
            return {
                'uid': user.uid,
                'email': user.email,
                'name': user.display_name,
                'picture': user.photo_url,
                'email_verified': user.email_verified,
                'disabled': user.disabled
            }
        except auth.UserNotFoundError:
            return None
        except Exception as e:
            logger.error(f"Error getting user by email: {str(e)}")
            return None

# Create global instance
firebase_auth = FirebaseAuth()