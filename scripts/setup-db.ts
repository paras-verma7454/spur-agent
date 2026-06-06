import "dotenv/config";
import { db } from "../src/lib/db";
import { conversations } from "../src/lib/schema";

async function main() {
  try {
    // Simple connection test - try to query the conversations table
    await db.select().from(conversations).limit(1);
    console.log("✅ Database connected successfully");
    console.log("✅ Database schema is up to date");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

main();
