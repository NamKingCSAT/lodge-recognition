import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account }) {
      if (account?.provider !== "github") {
        return false;
      }

      const adminId = process.env.ADMIN_GITHUB_ID;

      // Fail closed if the allowlist is not configured.
      if (!adminId) {
        return false;
      }

      return account.providerAccountId === adminId;
    },
  },
});
