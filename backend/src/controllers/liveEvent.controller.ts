import { Request, Response } from "express";
import LiveEvent from "../models/LiveEvent";

// ─── GET ALL (PUBLIC) ──────────────────────────────────────────────────────────
export const getPublicLiveEvents = async (
  _req: Request,
  res: Response
) => {
  try {
    const events = await LiveEvent.find({ status: { $ne: "ENDED" } })
      .select("title category status viewers lastUpdated videoUrl updates createdAt")
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (err) {
    console.error("Get public live events error:", err);
    res.status(500).json({ message: "Error fetching live events" });
  }
};

// ─── GET SINGLE BY ID (PUBLIC) ─────────────────────────────────────────────────
export const getPublicLiveEventById = async (
  req: Request,
  res: Response
) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;

    // Validate MongoDB ObjectId format
    if (!/^[a-f\d]{24}$/i.test(eventId)) {
      return res.status(404).json({ message: "Live event not found" });
    }

    const event = await LiveEvent.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Live event not found" });
    }

    res.json(event);
  } catch (err) {
    console.error("Get public live event by ID error:", err);
    res.status(500).json({ message: "Error fetching live event" });
  }
};

// ─── ADMIN: GET ALL ────────────────────────────────────────────────────────────
export const getAllLiveEvents = async (
  _req: Request,
  res: Response
) => {
  try {
    const events = await LiveEvent.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    console.error("Get all live events error:", err);
    res.status(500).json({ message: "Error fetching live events" });
  }
};

// ─── ADMIN: CREATE ─────────────────────────────────────────────────────────────
export const createLiveEvent = async (
  req: Request,
  res: Response
) => {
  try {
    const { title, category, status, viewers, lastUpdated, videoUrl, updates } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!category?.trim()) {
      return res.status(400).json({ message: "Category is required" });
    }

    const event = await LiveEvent.create({
      title: title.trim(),
      category: category.trim(),
      status: status || "LIVE",
      viewers: viewers || "0",
      lastUpdated: lastUpdated || "Just now",
      videoUrl: videoUrl || undefined,
      updates: updates || [],
    });

    res.status(201).json({ success: true, event });
  } catch (err) {
    console.error("Create live event error:", err);
    res.status(500).json({ message: "Error creating live event" });
  }
};

// ─── ADMIN: UPDATE ─────────────────────────────────────────────────────────────
export const updateLiveEvent = async (
  req: Request,
  res: Response
) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;

    if (!/^[a-f\d]{24}$/i.test(eventId)) {
      return res.status(404).json({ message: "Live event not found" });
    }

    const event = await LiveEvent.findByIdAndUpdate(eventId, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({ message: "Live event not found" });
    }

    res.json({ success: true, event });
  } catch (err) {
    console.error("Update live event error:", err);
    res.status(500).json({ message: "Error updating live event" });
  }
};

// ─── ADMIN: DELETE ─────────────────────────────────────────────────────────────
export const deleteLiveEvent = async (
  req: Request,
  res: Response
) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;

    if (!/^[a-f\d]{24}$/i.test(eventId)) {
      return res.status(404).json({ message: "Live event not found" });
    }

    const event = await LiveEvent.findByIdAndDelete(eventId);

    if (!event) {
      return res.status(404).json({ message: "Live event not found" });
    }

    res.json({ success: true, message: "Live event deleted" });
  } catch (err) {
    console.error("Delete live event error:", err);
    res.status(500).json({ message: "Error deleting live event" });
  }
};