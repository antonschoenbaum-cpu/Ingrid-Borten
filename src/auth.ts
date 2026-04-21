import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const username = process.env.ADMIN_USERNAME ?? "";
const password = process.env.ADMIN_PASSWORD ?? "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Brugernavn", type: "text" },
        password: { label: "Adgangskode", type: "password" },
      },
      authorize(credentials) {
        const u = credentials?.username as string | undefined;
        const p = credentials?.password as string | undefined;
        if (!u || !p || !username || !password) return null;
        if (u === username && p === password) {
          return { id: "admin", name: "Administrator" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin")) {
        return !!auth?.user;
      }
      return true;
    },
  },
  trustHost: true,
});
