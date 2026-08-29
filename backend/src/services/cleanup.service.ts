import cloudinary from "../config/cloudinary";
import AdInquiry from "../models/AdInquiry";

export async function cleanupPendingInquiries() {
  try {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    const expiryDate = new Date(Date.now() - THIRTY_DAYS);

    const expiredInquiries = await AdInquiry.find({
      status: "pending",
      submittedAt: { $lte: expiryDate },
    });

    if (expiredInquiries.length === 0) {
      console.log("Cleanup: No expired pending inquiries found.");
      return;
    }

    for (const inquiry of expiredInquiries) {
      try {
        // Delete image from Cloudinary
        if (inquiry.imagePublicId) {
          await cloudinary.uploader.destroy(inquiry.imagePublicId);
        }

        // Delete inquiry from MongoDB
        await inquiry.deleteOne();

        console.log(
          `Deleted expired inquiry: ${inquiry.email}`
        );
      } catch (err) {
        console.error(
          `Failed to delete inquiry ${inquiry._id}:`,
          err
        );
      }
    }

    console.log(
      `Cleanup completed. Removed ${expiredInquiries.length} expired inquiries.`
    );
  } catch (error) {
    console.error(
      "Cleanup service failed:",
      error
    );
  }
}