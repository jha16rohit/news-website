import cron from "node-cron";
import News from "./models/News";
import PublishedAd from "./models/PublishedAd";

export const startScheduler = () => {
  // Runs every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // ============================
      // Publish Scheduled News
      // ============================
      const posts = await News.find({
        status: "SCHEDULED",
        scheduledAt: { $lte: now },
      });

      for (const post of posts) {
        await News.findByIdAndUpdate(post._id, {
          status: "PUBLISHED",
          publishedAt: now,
        });

        console.log(`✅ Published: ${post.headline}`);
      }

      // ============================
      // Expire Advertisements
      // ============================
      const result = await PublishedAd.updateMany(
        {
          status: "active",
          expiresAt: { $lte: now },
        },
        {
          $set: {
            status: "expired",
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `✅ ${result.modifiedCount} advertisement(s) expired automatically.`
        );
      }
    } catch (err) {
      console.error("Scheduler error:", err);
    }
  });
};