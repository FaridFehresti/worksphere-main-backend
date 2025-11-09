import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const modulesPath = join(__dirname, 'modules');
const mainSchema = join(__dirname, 'schema.prisma');

const moduleSchemas = readdirSync(modulesPath)
  .filter((file) => file.endsWith('.prisma'))
  .map((file) => readFileSync(join(modulesPath, file), 'utf-8'))
  .join('\n\n');

const baseSchema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

${moduleSchemas}
`;

writeFileSync(mainSchema, baseSchema);
console.log('✅ Prisma schema compiled successfully.');
