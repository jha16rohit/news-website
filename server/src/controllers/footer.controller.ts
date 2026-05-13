import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";
import { deleteFooterImageFromStorage } from"../middleware/footerupload.middleware";

const SINGLETON_ID = "singleton";

// ─── GET Footer Settings ──────────────────────────────────────────────────────
export const getFooterSettings = async (req: Request, res: Response) => {
  try {
    let settings = await (prisma as any).footerSettings.findUnique({
      where: { id: SINGLETON_ID },
    });

    if (!settings) {
      return res.json({
        id:              SINGLETON_ID,
        sectionTitle:    "STAY UPDATED",
        descriptionText: "Get the latest headlines and in-depth stories delivered to your inbox.",
        trustedText:     "Your trusted source for real-time news and in-depth stories from India and around the world.",
        images:          [],
        updatedAt:       null,
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("getFooterSettings error:", error);
    res.status(500).json({ message: "Error fetching footer settings" });
  }
};

// ─── UPSERT Footer Settings (text + image list) ───────────────────────────────
// Images array contains only { id, url, name, resolution, isActive }
// URLs are already Supabase public URLs — no base64 ever stored here
export const updateFooterSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionTitle, descriptionText, trustedText, images } = req.body;

    if (sectionTitle    !== undefined && typeof sectionTitle    !== "string") return res.status(400).json({ message: "sectionTitle must be a string" });
    if (descriptionText !== undefined && typeof descriptionText !== "string") return res.status(400).json({ message: "descriptionText must be a string" });
    if (trustedText     !== undefined && typeof trustedText     !== "string") return res.status(400).json({ message: "trustedText must be a string" });
    if (images          !== undefined && !Array.isArray(images))              return res.status(400).json({ message: "images must be an array" });

    // Safety: reject any base64 blobs that slipped through
    if (Array.isArray(images)) {
      for (const img of images) {
        if (typeof img.url === "string" && img.url.startsWith("data:")) {
          return res.status(400).json({
            message: `Image "${img.name}" is a raw file — please use the upload endpoint first.`,
          });
        }
      }
    }

    const settings = await (prisma as any).footerSettings.upsert({
      where:  { id: SINGLETON_ID },
      update: {
        ...(sectionTitle    !== undefined && { sectionTitle }),
        ...(descriptionText !== undefined && { descriptionText }),
        ...(trustedText     !== undefined && { trustedText }),
        ...(images          !== undefined && { images }),
      },
      create: {
        id:              SINGLETON_ID,
        sectionTitle:    sectionTitle    ?? "STAY UPDATED",
        descriptionText: descriptionText ?? "Get the latest headlines and in-depth stories delivered to your inbox.",
        trustedText:     trustedText     ?? "Your trusted source for real-time news and in-depth stories from India and around the world.",
        images:          images          ?? [],
      },
    });

    res.json({ success: true, settings });
  } catch (error) {
    console.error("updateFooterSettings error:", error);
    res.status(500).json({ message: "Error saving footer settings" });
  }
};

// ─── UPLOAD a single footer image to Supabase ─────────────────────────────────
// uploadFooterImage middleware runs first and attaches uploadedFooterImageUrl
export const uploadFooterImageHandler = async (req: AuthRequest, res: Response) => {
  try {
    const imageUrl = (req as any).uploadedFooterImageUrl;
    if (!imageUrl) {
      return res.status(500).json({ message: "Upload failed — no URL returned from storage." });
    }
    res.json({ success: true, url: imageUrl });
  } catch (error) {
    console.error("uploadFooterImageHandler error:", error);
    res.status(500).json({ message: "Error uploading footer image" });
  }
};

// ─── DELETE a single footer image from Supabase + remove from DB ──────────────
export const deleteFooterImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    // 1. Delete file from Supabase Storage
    await deleteFooterImageFromStorage(imageUrl);

    // 2. Remove from the images JSON array in DB
    const current = await (prisma as any).footerSettings.findUnique({
      where: { id: SINGLETON_ID },
    });

    if (current && Array.isArray(current.images)) {
      const updatedImages = (current.images as any[]).filter(
        (img: any) => img.url !== imageUrl
      );
      await (prisma as any).footerSettings.update({
        where: { id: SINGLETON_ID },
        data:  { images: updatedImages },
      });
    }

    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    console.error("deleteFooterImage error:", error);
    res.status(500).json({ message: "Error deleting footer image" });
  }
};