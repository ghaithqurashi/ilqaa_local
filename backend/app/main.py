from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, HTMLResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pathlib import Path
from app.websockets.audio_ws import router as audio_ws_router
from app.websockets.pose_ws import router as pose_ws_router
from app.api.v1.analysis import router as analysis_router
from app.websockets.guidance_ws import router as guidance_ws_router
from app.websockets.sentiments_ws import router as sentiments_ws_router
from app.api.practice import router as practice_router
from app.core.config import settings
import os
from pathlib import Path
from app.config.env_loader import load_environment
# Import Firebase auth
from app.core.firebase_auth import firebase_auth
import os
from fastapi.templating import Jinja2Templates

# Create templates directory if it doesn't exist
templates_dir = Path(__file__).parent.parent / "templates"
templates_dir.mkdir(exist_ok=True)

# Initialize Jinja2 templates
templates = Jinja2Templates(directory=str(templates_dir))

def render_login_template():
    """Render login.html with Firebase configuration"""
    # Read the original login.html
    login_html_path = static_dir / "login.html"
    with open(login_html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Replace placeholders with actual values
    replacements = {
        '{{ FIREBASE_API_KEY }}': os.getenv('FIREBASE_API_KEY', ''),
        '{{ FIREBASE_AUTH_DOMAIN }}': os.getenv('FIREBASE_AUTH_DOMAIN', ''),
        '{{ FIREBASE_PROJECT_ID }}': os.getenv('FIREBASE_PROJECT_ID', ''),
        '{{ FIREBASE_STORAGE_BUCKET }}': os.getenv('FIREBASE_STORAGE_BUCKET', ''),
        '{{ FIREBASE_MESSAGING_SENDER_ID }}': os.getenv('FIREBASE_MESSAGING_SENDER_ID', ''),
        '{{ FIREBASE_APP_ID }}': os.getenv('FIREBASE_APP_ID', '')
    }
    
    for placeholder, value in replacements.items():
        html_content = html_content.replace(placeholder, value)
    
    return html_content

# Load environment variables
load_environment()

print(f"🔧 Loading environment...")
print(f"🌍 Environment: {settings.ENVIRONMENT}")
print(f"🚀 Backend URL: {settings.backend_url}")
print(f"🔗 WebSocket protocol: {settings.websocket_protocol}")

app = FastAPI()

# Security scheme for token authentication
security = HTTPBearer()

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return current user"""
    token = credentials.credentials
    user = firebase_auth.verify_session_token(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

# Dependency to check if user is authenticated (optional for some routes)
async def optional_auth(request: Request):
    """Optional authentication - returns user if authenticated, None otherwise"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        user = firebase_auth.verify_session_token(token)
        return user
    return None

# 🚀 INITIALIZATION AT APPLICATION STARTUP
@app.on_event("startup")
async def startup_event():
    """Initialize Firebase when the application starts"""
    print("🚀 Ilqaa Server Starting...")
    
    # Initialize Firebase
    print("🔐 Initializing Firebase...")
    from app.core.firebase_auth import initialize_firebase
    if initialize_firebase():
        print("✅ Firebase initialized successfully")
    else:
        print("⚠️  Firebase initialization failed (check environment variables)")

# Update CORS middleware to use settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include existing routers
app.include_router(analysis_router)
# Practice & oratory AI tasks used by the React frontend (/api/analyze, /api/tts)
app.include_router(practice_router)

# Mount static files
static_dir = Path(__file__).parent.parent / "static"

if static_dir.exists():
    # Mount specific subfolders to the root path to match Firebase structure
    app.mount("/css", StaticFiles(directory=str(static_dir / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(static_dir / "js")), name="js")
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")
    app.mount("/data", StaticFiles(directory=str(static_dir / "data")), name="data")

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Include WebSocket routers
app.include_router(audio_ws_router, tags=["audio"])
app.include_router(pose_ws_router, tags=["pose-analysis"])
app.include_router(guidance_ws_router, tags=["guidance"])
app.include_router(sentiments_ws_router, tags=["sentiments"])

# ========== AUTHENTICATION ENDPOINTS ==========

@app.post("/api/auth/login")
async def login(request: Request):
    """Authenticate user with Firebase ID token"""
    try:
        data = await request.json()
        id_token = data.get("token")
        
        if not id_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID token is required"
            )
        
        # Verify Firebase ID token
        user_info = firebase_auth.verify_id_token(id_token)
        
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token or user not authorized"
            )
        
        # Create session token
        session_token = firebase_auth.create_session_token(user_info)
        
        return {
            "success": True,
            "token": session_token,
            "user": {
                "uid": user_info["uid"],
                "email": user_info["email"],
                "name": user_info.get("name", ""),
                "picture": user_info.get("picture", ""),
                "email_verified": user_info.get("email_verified", False)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )

@app.post("/api/auth/test-login")
async def test_login(request: Request):
    """Test login endpoint for development (bypasses Firebase)"""
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Test login only available in development mode"
        )
    
    try:
        data = await request.json()
        email = data.get("email", "").lower().strip()
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required for test login"
            )
        
        # Get fresh allowed users list from environment (supports JSON array or CSV)
        allowed_users = firebase_auth._get_allowed_users()

        print(f"🔐 Test Login Debug: Email={email}")
        print(f"🔐 Test Login Debug: Allowed Users={allowed_users}")
        print(f"🔐 Test Login Debug: Is allowed?={email in allowed_users}")

        # If allowed_users is empty, allow any email in development. Otherwise require membership.
        if allowed_users and email not in allowed_users:
            print(f"🚫 Test login denied for {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authorized"
            )
        
        # Create mock user info
        mock_user_info = {
            "uid": f"test_{email.replace('@', '_at_')}",
            "email": email,
            "name": email.split('@')[0],
            "picture": "",
            "email_verified": True
        }
        
        # Create session token
        session_token = firebase_auth.create_session_token(mock_user_info)
        
        return {
            "success": True,
            "token": session_token,
            "user": {
                "uid": mock_user_info["uid"],
                "email": mock_user_info["email"],
                "name": mock_user_info["name"],
                "picture": mock_user_info["picture"],
                "email_verified": mock_user_info["email_verified"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Test login error: {str(e)}"
        )

@app.post("/api/auth/verify")
async def verify_token(request: Request):
    """Verify JWT session token"""
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No token provided"
        )
    
    token = auth_header.split(" ")[1]
    user = firebase_auth.verify_session_token(token)
    
    if user:
        return {
            "valid": True,
            "user": {
                "email": user["email"],
                "name": user.get("name", ""),
                "exp": user.get("exp")
            }
        }
    else:
        return {
            "valid": False,
            "error": "Invalid or expired token"
        }

@app.post("/api/auth/logout")
async def logout():
    """Logout user (client-side token invalidation)"""
    return {
        "success": True,
        "message": "Logged out successfully"
    }

@app.get("/api/auth/config")
async def get_firebase_config():
    """Get Firebase configuration for frontend"""
    if settings.ENVIRONMENT == "production":
        # In production, only return minimal config
        return {
            "apiKey": os.getenv("FIREBASE_API_KEY"),
            "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
            "projectId": os.getenv("FIREBASE_PROJECT_ID")
        }
    else:
        # In development, return full config
        return {
            "apiKey": os.getenv("FIREBASE_API_KEY"),
            "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
            "projectId": os.getenv("FIREBASE_PROJECT_ID"),
            "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
            "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
            "appId": os.getenv("FIREBASE_APP_ID")
        }

# ========== PROTECTED ROUTES ==========

@app.get("/")
async def root():
    """Landing page - no authentication required"""
    response = FileResponse(static_dir / "index.html")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.get("/login")
async def login_page():
    """Login page with injected Firebase configuration"""
    html_content = render_login_template()
    
    # Create response with proper headers
    return HTMLResponse(
        content=html_content,
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@app.get("/coach")
async def coach():
    """Coach page - authentication handled client-side"""
    # Serve the HTML page without authentication checks
    # Authentication will be handled by JavaScript
    response = FileResponse(static_dir / "coach.html")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.get("/results")
async def results():
    """Results page - authentication handled client-side"""
    response = FileResponse(static_dir / "results.html")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# ========== HEALTH ENDPOINTS ==========

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    auth_status = "enabled"
    try:
        # Test Firebase connection
        import firebase_admin
        if firebase_admin._apps:
            auth_status = "connected"
        else:
            auth_status = "disconnected"
    except:
        auth_status = "error"
    
    from app.api.practice import _text_engine, pronunciation_engine_summary
    from app.clients import asr_client, audio_client
    from app.services import live_transcriber
    from app.clients.llm_client import LLMClient

    try:
        _llm = LLMClient()
        llm_info = {"provider": _llm.provider.value, "model": _llm.model_name, "base_url": _llm.base_url}
    except Exception:
        llm_info = None

    return {
        "status": "healthy",
        "message": "Ilqaa server is running",
        "environment": settings.ENVIRONMENT,
        "authentication": auth_status,
        "practice_ai_engine": _text_engine() or "offline_fallback",
        "llm": llm_info,
        "pronunciation_engine": pronunciation_engine_summary(),
        "audio": audio_client.listen_config().public(),
        "tts": audio_client.tts_config().public(),
        "asr": asr_client.public(),
        "live_transcriber": live_transcriber.summary(),
        "audio_configured": audio_client.is_configured(),
        "gemini_configured": audio_client.is_configured() and audio_client.listen_config().provider == "gemini",
    }



# ========== ERROR HANDLERS ==========

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle authentication errors"""
    if exc.status_code == 401:
        # For API calls, return JSON error
        if request.url.path.startswith("/api/"):
            return JSONResponse(
                status_code=exc.status_code,
                content={"error": exc.detail}
            )
        # For page requests, let JavaScript handle it
        # (no longer redirecting to login)
        else:
            # Return the page anyway - JavaScript will redirect if needed
            if request.url.path == "/coach":
                response = FileResponse(static_dir / "coach.html")
                response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
                return response
            elif request.url.path == "/results":
                response = FileResponse(static_dir / "results.html")
                response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
                return response
    
    # For other errors, use default handler
    raise exc

@app.get("/api/auth/debug-allowed-users")
async def debug_allowed_users():
    """Debug endpoint to see current allowed users"""
    allowed_users_str = os.getenv('ALLOWED_USERS', '')
    allowed_users = [u.strip() for u in allowed_users_str.split(',') if u.strip()]
    
    return {
        "allowed_users": allowed_users,
        "raw_env_value": allowed_users_str,
        "count": len(allowed_users),
        "environment": settings.ENVIRONMENT
    }

# ========== PROTECTED API EXAMPLE ==========

@app.get("/api/protected/data")
async def protected_data(current_user: dict = Depends(get_current_user)):
    """Example protected endpoint"""
    return {
        "message": f"Hello {current_user['email']}!",
        "user": current_user,
        "data": "This is protected data"
    }