import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.isApproved = (user as any).isApproved
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isApproved = token.isApproved as boolean
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const publicRoutes = ["/sign-in", "/sign-up", "/api/auth"]
      const isPublicRoute = publicRoutes.some(
        (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(route + "/")
      )
      const isHomePage = nextUrl.pathname === "/"

      if (!isLoggedIn && !isPublicRoute && !isHomePage) {
        return false
      }

      return true
    },
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  trustHost: true,
}


