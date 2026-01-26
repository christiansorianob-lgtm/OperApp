import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // 1. Allow API routes to pass through (Auth handled by API logic)
    if (path.startsWith('/api')) {
        return NextResponse.next()
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
