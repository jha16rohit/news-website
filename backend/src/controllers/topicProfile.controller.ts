import { Request, Response } from "express";
import TopicProfile from "../models/TopicProfile";
import News from "../models/News";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: "ADMIN" | "EDITOR";
  };
}

// Articles are linked to a topic profile through the topic name
// stored inside the News.tags array.
async function countLinkedArticles(
  topicName: string,
  topicSlug: string
): Promise<number> {
  return News.countDocuments({
    $or: [
      // Topic linked through the article editor
      {
        content: {
          $regex: `/topic/${topicSlug}`,
          $options: "i",
        },
      },

      // Also support articles where the topic was added as a tag
      {
        tags: {
          $regex: `^${topicName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      },
    ],
  });
}

// ─── CREATE ────────────────────────────────────────────────────────────────
export const createProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const profile = await TopicProfile.create({
      ...req.body,
      authorId: req.user.id,
    });

    const linkedArticles = await countLinkedArticles(
  profile.name,
  profile.slug
);

    res.status(201).json({
      ...profile.toObject(),
      linkedArticles,
    });
  } catch (err) {
    console.error("Create topic profile error:", err);

    res.status(500).json({
      message: "Error creating profile",
    });
  }
};

// ─── GET ALL ───────────────────────────────────────────────────────────────
export const getProfiles = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const profiles = await TopicProfile.find().sort({
      createdAt: -1,
    });

    const result = await Promise.all(
      profiles.map(async (profile) => {
        const linkedArticles = await countLinkedArticles(
          profile.name,
          profile.slug
        );

        return {
          ...profile.toObject(),
          linkedArticles,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("Get topic profiles error:", err);

    res.status(500).json({
      message: "Error fetching profiles",
    });
  }
};

// ─── UPDATE ────────────────────────────────────────────────────────────────
export const updateProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const id = req.params.id as string;

    const profile = await TopicProfile.findById(id);

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    // Admin can edit every profile.
    // Editor can edit only the profile they created.
    if (
      req.user.role === "EDITOR" &&
      String(profile.authorId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        message: "You can only edit profiles created by you",
      });
    }

    const updated = await TopicProfile.findByIdAndUpdate(
      id,
      req.body,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    const linkedArticles = await countLinkedArticles(
      updated.name,
      updated.slug
    );

    res.json({
      ...updated.toObject(),
      linkedArticles,
    });
  } catch (err) {
    console.error("Update topic profile error:", err);

    res.status(500).json({
      message: "Error updating profile",
    });
  }
};

// ─── DELETE ────────────────────────────────────────────────────────────────
export const deleteProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const id = req.params.id as string;

    const profile = await TopicProfile.findById(id);

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    // Admin can delete every profile.
    // Editor can delete only the profile they created.
    if (
      req.user.role === "EDITOR" &&
      String(profile.authorId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        message: "You can only delete profiles created by you",
      });
    }

    await TopicProfile.findByIdAndDelete(id);

    res.json({
      message: "Deleted successfully",
    });
  } catch (err) {
    console.error("Delete topic profile error:", err);

    res.status(500).json({
      message: "Error deleting profile",
    });
  }
};  