import { Request, Response } from "express";
import TopicProfile from "../models/TopicProfile";
import News from "../models/News";

// ✅ CREATE
export const createProfile = async (req: Request, res: Response) => {
  try {
    const profile = await TopicProfile.create(req.body);

    const linkedArticles = await News.countDocuments({
      topicProfileId: String(profile._id),
    });

    res.status(201).json({
      ...profile.toObject(),
      linkedArticles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating profile" });
  }
};

// ✅ GET ALL
export const getProfiles = async (_req: Request, res: Response) => {
  try {
    const profiles = await TopicProfile.find().sort({ createdAt: -1 });

    const result = await Promise.all(
      profiles.map(async (p) => {
        const linkedArticles = await News.countDocuments({
          topicProfileId: String(p._id),
        });
        return { ...p.toObject(), linkedArticles };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profiles" });
  }
};

// ✅ UPDATE
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const updated = await TopicProfile.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated)
      return res.status(404).json({ message: "Profile not found" });

    const linkedArticles = await News.countDocuments({
      topicProfileId: id,
    });

    res.json({ ...updated.toObject(), linkedArticles });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
};

// ✅ DELETE
export const deleteProfile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await TopicProfile.findByIdAndDelete(id);

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting profile" });
  }
};