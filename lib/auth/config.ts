import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

// Edge-safe base config: no Prisma or bcrypt here so it can run in
// middleware. The Credentials provider (which needs both) is added in
// lib/auth/auth.ts for use in Server Components, Route Handlers, and
// Server Actions.
const ADMIN_ONLY_PREFIXES = ["/tutors", "/users"];
const PUBLIC_PATHS = ["/login"];

export const authConfig = {
  // Lets Auth.js infer the deployed origin from request headers instead of
  // requiring NEXTAUTH_URL to be hardcoded — needed on hosts like Render
  // where the URL isn't known until after the first deploy. Safe because
  // the app always sits behind the host's own TLS-terminating proxy.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;
      const isPublic = PUBLIC_PATHS.includes(pathname);

      if (isPublic) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) return false;

      const isAdminOnly = ADMIN_ONLY_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
      );
      const role = (auth.user as { role?: Role } | undefined)?.role;
      if (isAdminOnly && role !== "ADMIN") {
        return Response.redirect(new URL("/unauthorized", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
