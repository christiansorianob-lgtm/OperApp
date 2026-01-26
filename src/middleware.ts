import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // 1. Define routes that do NOT need authentication
    const publicPaths = [
        '/login',
        '/portal/login',
        '/api/v1/public/login',
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
        return NextResponse.next()
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

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
