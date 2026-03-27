import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const pathname = req.nextUrl.pathname;

        // Public auth pages (accessible without login)
        const isPublicPage = pathname.startsWith("/login") 
            || pathname.startsWith("/forgot-password") 
            || pathname.startsWith("/reset-password")
            || pathname.startsWith("/landing")
            || pathname.startsWith("/tracking");

        if (isPublicPage) {
            // If already logged in and trying to access login, redirect to home
            if (isAuth && pathname.startsWith("/login")) {
                return NextResponse.redirect(new URL("/", req.url));
            }
            return null;
        }

        if (!isAuth) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const pathname = req.nextUrl.pathname;
                // Allow public pages without a token
                if (pathname.startsWith("/login") 
                    || pathname.startsWith("/forgot-password") 
                    || pathname.startsWith("/reset-password")
                    || pathname.startsWith("/landing")
                    || pathname.startsWith("/tracking")) {
                    return true;
                }
                return !!token;
            },
        },
    }
);

export const config = {
    // Exclude API routes, Next.js internals, static files, and public assets
    matcher: ["/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp|.*\\.ico).*)" ],
};
