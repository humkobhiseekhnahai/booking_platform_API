// src/utils/client.ts

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Export Prisma Client in CommonJS format
module.exports = { prisma };
