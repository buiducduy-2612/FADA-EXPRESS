import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const email = credentials?.email?.toLowerCase();
                    const password = credentials?.password;

                    if (!email || !password) {
                        throw new Error("Invalid credentials format");
                    }

                    const user = await prisma.user.findUnique({
                        where: { email },
                    });

                    if (!user || !user.password) {
                        throw new Error("User not found");
                    }

                    const isValid = await bcrypt.compare(password, user.password);

                    if (!isValid) {
                        throw new Error("Invalid password");
                    }

                    const u = user as any;
                    return {
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        commissionRate: u.commissionRate,
                    };
                } catch (error: any) {
                    console.error("Authorize error:", error.message);
                    throw error;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
                token.commissionRate = (user as any).commissionRate;
            }
            if (trigger === "update") {
                if (session?.name) token.name = session.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
                (session.user as any).commissionRate = token.commissionRate;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
