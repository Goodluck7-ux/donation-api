import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { sendEmail } from '../common/email';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),

    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: 'Reset your password',
                html: `Click <a href="${url}">here</a> to reset your password. This link expires shortly.`,
            });
        },
    },

    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: 'Verify your email',
                html: `Click <a href="${url}">here</a> to verify your email.`,
            });
        },
    },

    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [
        process.env.FRONTEND_URL ?? 'http://localhost:3001',
        'http://localhost:3000',
    ],

    advanced: {
        defaultCookieAttributes: {
            sameSite: 'none',
            secure: true,
        },
    },

    user: {
        additionalFields: {
            role: { type: 'string', defaultValue: 'DONOR', input: false },
        },
    },

    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ['google', 'github'],
        },
    },

    socialProviders: {
        google: {
            clientId: requireEnv('GOOGLE_CLIENT_ID'),
            clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
        },
        github: {
            clientId: requireEnv('GITHUB_CLIENT_ID'),
            clientSecret: requireEnv('GITHUB_CLIENT_SECRET'),
        },
    },
});