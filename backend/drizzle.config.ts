import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite', // Default to sqlite for dev, can switch to postgres
  dbCredentials: {
    url: process.env.DATABASE_URL || 'sqlite.db',
  },
});
