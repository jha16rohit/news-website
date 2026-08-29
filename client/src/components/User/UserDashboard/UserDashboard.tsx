import React, { useEffect, useState } from "react";
import HeroSection from "../HomeHero/HomeHero";
import LatestNews from "../LatestNews/LatestNews";
import Advertisment from "../Advertisment/Advertisment";
import CategoryShowcase from "../CategoryShowcase/CategoryShowcase";
import Preloader from "../../Admin/Preloader/Preloder";
import {getAdvertisementPool,type Advertisement,} from "../../../api/user/advertisementPool";

const UserDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<{cards: Advertisement[];
  strips: Advertisement[];
}>({
  cards: [],
  strips: [],
});


useEffect(() => {
  const loadDashboard = async () => {
    try {
      const adResponse = await getAdvertisementPool({
        cards: 0,
        strips: 2,
      });

      setAds(adResponse);
    } catch (error) {
      console.error("Failed to load advertisements:", error);
    } finally {
      setLoading(false);
    }
  };

  loadDashboard();
}, []);




  if (loading) {
    return <Preloader />;
  }

  return (
    <>
      <HeroSection />
      <Advertisment
  adData={ads.strips[0] ?? null}
/>
      <LatestNews />
      <CategoryShowcase />
      <Advertisment
  adData={ads.strips[1] ?? null}
/>
    </>
  );
};

export default UserDashboard;