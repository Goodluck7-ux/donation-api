"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const adapter_pg_1 = require("@prisma/adapter-pg");
require("dotenv/config");
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new prisma_1.PrismaClient({ adapter });
async function main() {
    const adminEmail = process.argv[2];
    if (!adminEmail) {
        console.error('Usage: npx ts-node prisma/seed.ts your-email@example.com');
        process.exit(1);
    }
    const updated = await prisma.user.updateMany({
        where: { email: adminEmail },
        data: { role: 'PLATFORM_ADMIN' },
    });
    if (updated.count === 0) {
        console.log(`No user found with email ${adminEmail} — register that account first, then re-run this.`);
    }
    else {
        console.log(`✅ Promoted ${adminEmail} to PLATFORM_ADMIN`);
    }
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map