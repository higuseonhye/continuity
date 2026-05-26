import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./memory/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/memory.sqlite",
  },
});
