import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      // ---
      if (!isOnDashboard && isLoggedIn)
        return Response.redirect(new URL("/dashboard", nextUrl));
      if (!isOnDashboard || (isOnDashboard && isLoggedIn)) return true;
      return false;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
