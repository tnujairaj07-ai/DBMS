require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("social_media_db");

    // a) Total likes per post
    const likesPerPost = await db.collection("likes").aggregate([
      {
        $group: {
          _id: "$postId",
          totalLikes: { $sum: 1 }
        }
      },
      {
        $sort: { totalLikes: -1 }
      }
    ]).toArray();

    console.log("\nTotal likes per post:");
    console.log(likesPerPost);

    // b) Total posts per user
    const postsPerUser = await db.collection("posts").aggregate([
      {
        $group: {
          _id: "$userId",
          totalPosts: { $sum: 1 }
        }
      },
      {
        $sort: { totalPosts: -1 }
      }
    ]).toArray();

    console.log("\nTotal posts per user:");
    console.log(postsPerUser);

    // c) Average comments per post
    const averageComments = await db.collection("posts").aggregate([
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "postComments"
        }
      },
      {
        $addFields: {
          commentCount: { $size: "$postComments" }
        }
      },
      {
        $group: {
          _id: null,
          averageCommentsPerPost: { $avg: "$commentCount" },
          totalPosts: { $sum: 1 }
        }
      }
    ]).toArray();

    console.log("\nAverage comments per post:");
    console.log(averageComments);

    // d) Posts joined with user names and like count
    const postsWithUsersAndLikes = await db.collection("posts").aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "author"
        }
      },
      {
        $unwind: "$author"
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          as: "postLikes"
        }
      },
      {
        $addFields: {
          likeCount: { $size: "$postLikes" }
        }
      },
      {
        $project: {
          _id: 0,
          userName: "$author.name",
          postContent: "$content",
          likeCount: 1
        }
      },
      {
        $sort: { likeCount: -1 }
      }
    ]).toArray();

    console.log("\nPosts with user names and like counts:");
    console.log(postsWithUsersAndLikes);

  } finally {
    await client.close();
  }
}

run().catch(console.error);