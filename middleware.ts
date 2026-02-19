import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req: NextRequest & { auth: unknown }) => {
  const isLoggedIn = !!(req as { auth?: unknown }).auth
  const { pathname } = req.nextUrl

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/receipt") ||
    pathname.startsWith("/api/auth")

  if (isPublic) return NextResponse.next()

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/pos", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
