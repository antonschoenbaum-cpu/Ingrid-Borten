import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import {
  canUseSupabaseAdminUsers,
  findAdminUserByUsername,
} from "@/lib/supabase-admin-users";

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
      async authorize(credentials) {
        const u = credentials?.username as string | undefined;
        const p = credentials?.password as string | undefined;

        if (!u || !p) return null;

        if (canUseSupabaseAdminUsers()) {
          try {
            const user = await findAdminUserByUsername(u.trim());
            if (user) {
              const ok = await compare(p, user.password_hash);
              if (ok) {
                return { id: user.id, name: user.username };
              }
            }
          } catch {
            // Falder tilbage til env login.
          }
        }

        if (username && password && u === username && p === password) {
          return { id: "env-admin", name: username };
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
