import { Request, Response } from "express";
import prisma from "../config/db";

// ✅ CREATE
export const createProfile = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const profile = await prisma.topicProfile.create({
      data,
      include: { _count: { select: { news: true } } },
    });

    res.status(201).json({
      ...profile,
      linkedArticles: profile._count.news,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating profile" });
  }
};

// ✅ GET ALL
export const getProfiles = async (_req: Request, res: Response) => {
  try {
    const profiles = await prisma.topicProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { news: true } } },
    });

    const result = profiles.map((p) => ({
      ...p,
      linkedArticles: p._count.news,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profiles" });
  }
};

// ✅ UPDATE
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const updated = await prisma.topicProfile.update({
      where: { id },
      data: req.body,
      include: { _count: { select: { news: true } } },
    });

    res.json({
      ...updated,
      linkedArticles: updated._count.news,
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
};

// ✅ DELETE
export const deleteProfile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.topicProfile.delete({
      where: { id },
    });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting profile" });
  }
};