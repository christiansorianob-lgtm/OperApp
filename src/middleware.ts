import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // CORS Handling
    const origin = request.headers.get('origin');

    // Define allowed origins (or use '*' for public API)
    // For mobile apps, origin might be null or specific
    const allowedOrigin = origin || '*';

    // Handle OPTIONS method for CORS preflight
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': allowedOrigin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // 1. Define routes that do NOT need authentication
    const publicPaths = [
        '/login',
        '/portal/login',
        '/api/v1/', // Allow all v1 API routes (Mobile App)
        '/api/health',
        '/hello.html',
        '/test-page',
        '/_next',
        '/favicon.ico',
        '/logo-ravelo-transparent.png'
    ]

    const path = request.nextUrl.pathname

    // 2. Check if the path is public
    if (publicPaths.some(p => path.startsWith(p))) {
        // Add CORS headers to public responses
        const response = NextResponse.next()

        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version')
        response.headers.set('Access-Control-Max-Age', '86400')

        return response
    }

    // 3. For protected routes, check for a session cookie
    // Note: Since we haven't implemented full cookie-based auth in the web login yet (it was mostly for mobile API),
    // we are currently in a transition state.
    // Ideally, the web login action should set a 'session' cookie.

    const hasSession = request.cookies.has('operapp_admin_session') || request.cookies.has('auth_token') // Adjust cookie name as needed

    if (!hasSession) {
        // 4. Redirect to login if no session
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Pass CORS headers to protected routes as well
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

export const config = {
    matcher: [
        '/api/:path*',
        '/login',
        '/portal/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
