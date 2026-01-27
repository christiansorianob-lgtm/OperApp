import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // 1. Handle CORS for API routes
    if (path.startsWith('/api')) {
        // Handle Preflighted Requests
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        // Add CORS headers to actual response
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return response;
    }

    // 2. Allow static assets and Next.js internals
    if (
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path === '/favicon.ico' ||
        path === '/hello.html' ||
        path.match(/\.(png|jpg|jpeg|gif|svg)$/)
    ) {
        return NextResponse.next()
    }

    // 3. Allow Login Page
    if (path.startsWith('/login')) {
        return NextResponse.next()
    }

    // 4. Protected Routes (Dashboard)
    // Check for session cookie
    const adminCookie = request.cookies.get('operapp_admin_session')

    if (!adminCookie) {
        // Redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // Match everything that isn't a static file
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
