import cron from "node-cron";
import prisma from "./config/db";

export const startScheduler = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    const posts = await prisma.news.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          lte: now
        }
      }
    });

    for (const post of posts) {
      await prisma.news.update({
        where: { id: post.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date()
        }
      });

      console.log(`✅ Published: ${post.headline}`);
    }
  });
};