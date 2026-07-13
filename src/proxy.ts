import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')
  
  if (!user && !isAuthRoute) {
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const role = user.user_metadata?.role || 'student'

    // If user is logged in and visits auth routes, redirect to their dashboard
    if (isAuthRoute || request.nextUrl.pathname === '/') {
      if (role === 'teacher') {
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/student/dashboard', request.url))
      }
    }

    // Protect /teacher/* routes from students
    if (request.nextUrl.pathname.startsWith('/teacher') && role !== 'teacher') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }

    // Protect /student/* routes from teachers
    if (request.nextUrl.pathname.startsWith('/student') && role !== 'student') {
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
