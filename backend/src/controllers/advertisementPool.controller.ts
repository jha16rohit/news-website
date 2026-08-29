import { Request, Response } from "express";
import advertisementPool from "../services/advertisement/AdvertisementPool";

export const getAdvertisementPool = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const cards = Number(req.query.cards ?? 0);
    const strips = Number(req.query.strips ?? 0);

    if (cards < 0 || strips < 0) {
      res.status(400).json({
        success: false,
        message: "cards and strips must be greater than or equal to 0.",
      });
      return;
    }

    const advertisements = await advertisementPool.allocate({
      cards,
      strips,
    });

    res.status(200).json({
      success: true,
      message: "Advertisement pool fetched successfully.",
      data: advertisements,
    });

  } catch (error) {
    console.error("Advertisement Pool Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch advertisement pool.",
    });
  }
};