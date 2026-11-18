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
    const likes = db.collection("likes");

    // Start clean
    await users.deleteMany({});
    await posts.deleteMany({});
    await comments.deleteMany({});
    await likes.deleteMany({});

    // Insert 6 users
    const userDocs = [
      { name: "Tanuj Sharma", email: "tanuj@example.com", city: "Gurugram" },
      { name: "Aarav Mehta", email: "aarav@example.com", city: "Delhi" },
      { name: "Priya Nair", email: "priya@example.com", city: "Mumbai" },
      { name: "Rahul Verma", email: "rahul@example.com", city: "Bengaluru" },
      { name: "Sneha Kapoor", email: "sneha@example.com", city: "Pune" },
      { name: "Vikram Singh", email: "vikram@example.com", city: "Jaipur" }
    ];

    const userResult = await users.insertMany(userDocs);
    const userIds = userResult.insertedIds;
    console.log("Inserted users:", userIds);

    // Insert 10 posts
    const postDocs = [
      { userId: userIds[0], content: "Learning MongoDB aggregation pipelines." },
      { userId: userIds[0], content: "Indexes can improve query performance." },
      { userId: userIds[1], content: "Started a new web development project." },
      { userId: userIds[1], content: "JavaScript promises make async code easier." },
      { userId: userIds[2], content: "Enjoying a peaceful evening in Mumbai." },
      { userId: userIds[2], content: "Reading about database normalization." },
      { userId: userIds[3], content: "Bengaluru weather is pleasant today." },
      { userId: userIds[4], content: "Working on a machine learning assignment." },
      { userId: userIds[5], content: "Exploring Rajasthan heritage sites." },
      { userId: userIds[5], content: "Trying a new coffee recipe at home." }
    ];

    postDocs.forEach(post => post.createdAt = new Date());

    const postResult = await posts.insertMany(postDocs);
    const postIds = postResult.insertedIds;
    console.log("Inserted posts:", postIds);

    // Insert 15 comments
    const commentDocs = [
      { postId: postIds[0], userId: userIds[1], content: "Great start!" },
      { postId: postIds[0], userId: userIds[2], content: "Very useful topic." },
      { postId: postIds[0], userId: userIds[3], content: "Aggregation is powerful." },
      { postId: postIds[1], userId: userIds[4], content: "Indexes are important." },
      { postId: postIds[1], userId: userIds[5], content: "Thanks for sharing." },
      { postId: postIds[2], userId: userIds[0], content: "All the best!" },
      { postId: postIds[2], userId: userIds[3], content: "Excited to see it." },
      { postId: postIds[3], userId: userIds[2], content: "Promises are useful." },
      { postId: postIds[4], userId: userIds[0], content: "Mumbai evenings are lovely." },
      { postId: postIds[5], userId: userIds[1], content: "Normalization is fundamental." },
      { postId: postIds[6], userId: userIds[4], content: "Nice weather indeed." },
      { postId: postIds[7], userId: userIds[5], content: "Good luck with the assignment." },
      { postId: postIds[8], userId: userIds[0], content: "Rajasthan is beautiful." },
      { postId: postIds[9], userId: userIds[2], content: "Coffee recipe looks interesting." },
      { postId: postIds[9], userId: userIds[3], content: "Please share the recipe." }
    ];

    commentDocs.forEach(comment => comment.createdAt = new Date());
    await comments.insertMany(commentDocs);

    // Insert 20 likes
    const likeDocs = [];

    for (let i = 0; i < 20; i++) {
      likeDocs.push({
        postId: postIds[i % postIds.length],
        userId: userIds[i % userIds.length],
        createdAt: new Date()
      });
    }

    await likes.insertMany(likeDocs);

    console.log("\nCollection counts:");
    console.log("Users:", await users.countDocuments());
    console.log("Posts:", await posts.countDocuments());
    console.log("Comments:", await comments.countDocuments());
    console.log("Likes:", await likes.countDocuments());

    // a) Find posts by Tanuj
    const tanuj = await users.findOne({ email: "tanuj@example.com" });

    console.log("\nPosts by Tanuj:");
    console.log(await posts.find({ userId: tanuj._id }).toArray());

    // b) Update a post
    const updateResult = await posts.updateOne(
      { _id: postIds[0] },
      { $set: { content: "Learning MongoDB aggregation pipelines and indexing." } }
    );

    console.log("\nUpdate result:", updateResult);
    console.log("Updated post:", await posts.findOne({ _id: postIds[0] }));

    // c) Delete one comment
    const commentToDelete = await comments.findOne({ postId: postIds[0] });

    const deleteResult = await comments.deleteOne({ _id: commentToDelete._id });
    console.log("\nDelete result:", deleteResult);

    console.log("Remaining comments for first post:");
    console.log(await comments.find({ postId: postIds[0] }).toArray());

  } finally {
    await client.close();
  }
}

run().catch(console.error);