import cron from "node-cron";
import News from "./models/News";

export const startScheduler = () => {
  // Runs every minute — publishes any scheduled articles whose time has come
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const posts = await News.find({
        status: "SCHEDULED",
        scheduledAt: { $lte: now },
      });

      for (const post of posts) {
        await News.findByIdAndUpdate(post._id, {
          status: "PUBLISHED",
          publishedAt: new Date(),
        });

        console.log(`✅ Published: ${post.headline}`);
      }
    } catch (err) {
      console.error("Scheduler error:", err);
    }
  });
};