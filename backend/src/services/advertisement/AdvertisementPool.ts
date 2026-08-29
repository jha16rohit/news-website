import AdvertisementPoolModel from "../../models/AdvertisementPool";
import PublishedAd from "../../models/PublishedAd";
import {
  PoolAdvertisement,
  PoolRequest,
  PoolResponse,
  AdvertisementType,
} from "./PoolTypes";

class AdvertisementPool {

  private static instance: AdvertisementPool;

  private constructor() {}

  /**
   * Singleton Instance
   */
  public static getInstance(): AdvertisementPool {

    if (!AdvertisementPool.instance) {
      AdvertisementPool.instance =
        new AdvertisementPool();
    }

    return AdvertisementPool.instance;
  }

  /**
   * Allocate advertisements
   */
  public async allocate(
    request: PoolRequest
  ): Promise<PoolResponse> {

    return {
      cards: await this.allocateByType(
        "card",
        request.cards
      ),

      strips: await this.allocateByType(
        "strip",
        request.strips
      ),
    };
  }

  /**
   * Allocate advertisements by type
   */
  private async allocateByType(
    adType: AdvertisementType,
    count: number
  ): Promise<PoolAdvertisement[]> {

    if (count <= 0) {
  return [];
}

const poolAds = await AdvertisementPoolModel.find({
  adType,
  isActive: true,
}).sort({
  queueOrder: 1,
});

if (poolAds.length === 0) {
  return [];
}

const selectedPoolAds = [];

for (let i = 0; i < count; i++) {
  selectedPoolAds.push(
    poolAds[i % poolAds.length]
  );
}

const advertisements: PoolAdvertisement[] = [];

for (const poolAd of selectedPoolAds) {

  const ad = await PublishedAd.findById(
    poolAd.publishedAdId
  );

  if (
    ad &&
    ad.status === "active"
  ) {
    advertisements.push(
      ad as unknown as PoolAdvertisement
    );
  }

}

const rotation = Math.min(count, poolAds.length);

const rotatedPoolAds = [
  ...poolAds.slice(rotation),
  ...poolAds.slice(0, rotation),
];

for (let i = 0; i < rotatedPoolAds.length; i++) {
  await AdvertisementPoolModel.updateOne(
    { _id: rotatedPoolAds[i]._id },
    {
      $set: {
        queueOrder: i + 1,
      },
    }
  );
}

return advertisements;

  }
}

export default AdvertisementPool.getInstance();