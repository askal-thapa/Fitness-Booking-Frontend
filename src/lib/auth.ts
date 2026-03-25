import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Askal Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch("http://localhost:3001/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" },
          });

          const data = await res.json();

          if (res.ok && data.access_token) {
            // After login, we fetch "whoami" to ensure we have the latest profile
            const meRes = await fetch("http://localhost:3001/auth/me", {
              headers: { 
                  "Authorization": `Bearer ${data.access_token}`,
                  "Content-Type": "application/json"
              },
            });
            
            const userData = await meRes.json();
            
            return {
              id: userData.id.toString(),
              name: userData.fullName,
              email: userData.email,
              role: userData.role,
              onboardingCompleted: userData.onboardingCompleted,
              accessToken: data.access_token,
            };
          }
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.onboardingCompleted = (user as any).onboardingCompleted;
      }
      
      // Handle update trigger for when onboarding is completed
      if (trigger === "update" && session?.onboardingCompleted !== undefined) {
        token.onboardingCompleted = session.onboardingCompleted;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).role = token.role;
        (session.user as any).onboardingCompleted = token.onboardingCompleted;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 15 * 24 * 60 * 60, // 15 days
  },
  secret: process.env.NEXTAUTH_SECRET || "askal-fit-secret-2026",
};
