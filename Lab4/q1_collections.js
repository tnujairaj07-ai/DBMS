require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("social_media_db");

    // Clear previous sample data
    await db.collection("users").deleteMany({});
    await db.collection("posts").deleteMany({});
    await db.collection("comments").deleteMany({});
    await db.collection("likes").deleteMany({});

    // USERS
    const userResult = await db.collection("users").insertOne({
      name: "Tanuj Sharma",
      email: "tanuj@example.com",
      city: "Gurugram",
      createdAt: new Date()
    });

    console.log("Inserted user:", userResult.insertedId);

    const tanujId = userResult.insertedId;

    // POSTS — userId is referenced
    const postResult = await db.collection("posts").insertOne({
      userId: tanujId,
      content: "My first post on MongoDB aggregation pipelines!",
      createdAt: new Date()
    });

    console.log("Inserted post:", postResult.insertedId);
    const postId = postResult.insertedId;

    // COMMENTS — userId and postId are referenced
    const commentResult = await db.collection("comments").insertOne({
      postId: postId,
      userId: tanujId,
      content: "This is my first comment.",
      createdAt: new Date()
    });

    console.log("Inserted comment:", commentResult.insertedId);

    // LIKES — userId and postId are referenced
    const likeResult = await db.collection("likes").insertOne({
      postId: postId,
      userId: tanujId,
      createdAt: new Date()
    });

    console.log("Inserted like:", likeResult.insertedId);

    // Display each collection using find()
    console.log("\nUSERS:");
    console.log(await db.collection("users").find().toArray());

    console.log("\nPOSTS:");
    console.log(await db.collection("posts").find().toArray());

    console.log("\nCOMMENTS:");
    console.log(await db.collection("comments").find().toArray());

    console.log("\nLIKES:");
    console.log(await db.collection("likes").find().toArray());

  } finally {
    await client.close();
  }
}

run().catch(console.error);