import "dotenv/config";
import { db } from "../src/lib/db";
import { conversations, messages } from "../src/lib/schema";
import { eq } from "drizzle-orm";

async function testDatabase() {
  console.log("🔍 Testing Drizzle + NeonDB connection...\n");

  try {
    // Test 1: Create a test conversation
    console.log("\n📝 Creating a test conversation...");
    const [conversation] = await db.insert(conversations).values({}).returning();
    console.log("✅ Created conversation:", conversation.id);

    // Test 2: Create a test message
    console.log("\n📝 Creating a test message...");
    const [message] = await db
      .insert(messages)
      .values({
        conversationId: conversation.id,
        sender: "user",
        text: "Hello, this is a test message!",
      })
      .returning();
    console.log("✅ Created message:", message.id);

    // Test 3: Fetch messages
    console.log("\n📋 Fetching messages...");
    const fetchedMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id));
    console.log(`✅ Found ${fetchedMessages.length} message(s)`);

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await db.delete(messages).where(eq(messages.conversationId, conversation.id));
    await db.delete(conversations).where(eq(conversations.id, conversation.id));
    console.log("✅ Cleanup complete");

    console.log("\n🎉 All tests passed! Your database is working perfectly.\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testDatabase();
