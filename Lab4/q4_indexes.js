require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("social_media_db");

    const users = db.collection("users");
    const posts = db.collection("posts");
    const comments = db.collection("comments");

    const tanuj = await users.findOne({ email: "tanuj@example.com" });

    // BEFORE creating the posts.userId index
    const before = await posts
      .find({ userId: tanuj._id })
      .explain("executionStats");

    console.log("\nBEFORE INDEX:");
    console.log("Winning plan:", JSON.stringify(before.queryPlanner.winningPlan, null, 2));
    console.log("Execution stats:", JSON.stringify(before.executionStats, null, 2));

    // Create single-field index
    await posts.createIndex({ userId: 1 });

    // Create compound index
    await comments.createIndex({ postId: 1, createdAt: -1 });

    console.log("\nPosts indexes:");
    console.log(await posts.indexes());

    console.log("\nComments indexes:");
    console.log(await comments.indexes());

    // AFTER creating the posts.userId index
    const after = await posts
      .find({ userId: tanuj._id })
      .explain("executionStats");

    console.log("\nAFTER INDEX:");
    console.log("Winning plan:", JSON.stringify(after.queryPlanner.winningPlan, null, 2));
    console.log("Execution stats:", JSON.stringify(after.executionStats, null, 2));

    // Compare key metrics
    console.log("\nComparison:");
    console.log("Before totalDocsExamined:", before.executionStats.totalDocsExamined);
    console.log("After totalDocsExamined:", after.executionStats.totalDocsExamined);
    console.log("Before executionTimeMillis:", before.executionStats.executionTimeMillis);
    console.log("After executionTimeMillis:", after.executionStats.executionTimeMillis);

  } finally {
    await client.close();
  }
}

run().catch(console.error);