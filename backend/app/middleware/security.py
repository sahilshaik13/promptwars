"""
Security headers middleware for FastAPI
Implements CSP, HSTS, X-Frame-Options, and other security headers
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security headers to all responses:
    - Content-Security-Policy (CSP)
    - Strict-Transport-Security (HSTS)
    - X-Frame-Options
    - X-Content-Type-Options
    - Referrer-Policy
    - Permissions-Policy
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.gstatic.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: blob: https://storage.googleapis.com https://*.googleusercontent.com; "
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://www.googleapis.com; "
            "frame-src 'self' https://accounts.google.com; "
            "worker-src 'self' blob:; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "upgrade-insecure-requests"
        )
        response.headers['Content-Security-Policy'] = csp

        # Strict-Transport-Security (HSTS) - 1 year
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'

        # X-Frame-Options - Prevent clickjacking
        response.headers['X-Frame-Options'] = 'DENY'

        # X-Content-Type-Options - Prevent MIME sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'

        # X-XSS-Protection - Legacy XSS filter (modern browsers use CSP)
        response.headers['X-XSS-Protection'] = '1; mode=block'

        # Referrer-Policy - Control referrer information
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Permissions-Policy - Control browser features
        permissions_policy = (
            "accelerometer=(), "
            "camera=(), "
            "cross-origin-isolated=(), "
            "display-capture=(), "
            "document-domain=(), "
            "fullscreen=(self), "
            "geolocation=(), "
            "gyroscope=(), "
            "keyboard-map=(self), "
            "magnetometer=(), "
            "microphone=(), "
            "midi=(), "
            "navigation-override=(), "
            "payment=(), "
            "picture-in-picture=(self), "
            "publickey-credentials-get=(), "
            "screen-wake-lock=(), "
            "sync-xhr=(), "
            "usb=(), "
            "web-share=(), "
            "xr-spatial-tracking=()"
        )
        response.headers['Permissions-Policy'] = permissions_policy

        # Cache-Control - Prevent sensitive data caching
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
        response.headers['Pragma'] = 'no-cache'

        # Remove server information
        response.headers['Server'] = 'SmartVenue'

        return response


class CORSMiddleware:
    """
    Enhanced CORS middleware with strict settings
    """

    def __init__(self, app, allowed_origins: list[str]):
        self.app = app
        self.allowed_origins = allowed_origins

    async def __call__(self, scope, receive, send):
        if scope['type'] == 'http':
            request = Request(scope, receive)
            response = await self.handle(request)
            await response(scope, receive, send)
        else:
            await self.app(scope, receive, send)

    async def handle(self, request: Request) -> Response:
        origin = request.headers.get('origin', '')

        # Check if origin is allowed
        if origin not in self.allowed_origins:
            origin = self.allowed_origins[0] if self.allowed_origins else ''

        # Process the request
        response = await self.app(request.scope, request.receive)

        # Add CORS headers
        if hasattr(response, 'headers'):
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            response.headers['Access-Control-Max-Age'] = '3600'

        return response
