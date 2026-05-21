import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Define dynamically which env file to use. DB_ENV=production points to .env.production.
const envFile = process.env.DB_ENV === "production" ? ".env.production" : ".env.local";
dotenv.config({ path: envFile });

export default defineConfig({
  schema: "./modules/**/*.schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

