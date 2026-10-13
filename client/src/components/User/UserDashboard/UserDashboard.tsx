import React, { useEffect, useState } from "react";

import HeroSection from "../HomeHero/HomeHero";
import LatestNews from "../LatestNews/LatestNews";
import Advertisment from "../Advertisment/Advertisment";
import CategoryShowcase from "../CategoryShowcase/CategoryShowcase";

import {
  getAdvertisementPool,
  type Advertisement,
} from "../../../api/user/advertisementPool";

import { getHomepageNews } from "../../../api/user/news";
import { getPublicCategories } from "../../../api/user/categoryNews";
import { fetchAllNews } from "../../../api/news";

import type { Category } from "../../../types/category";

const UserDashboard: React.FC = () => {
  const [ads, setAds] = useState<{
    cards: Advertisement[];
    strips: Advertisement[];
  }>({
    cards: [],
    strips: [],
  });

  const [homepageNews, setHomepageNews] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allNews, setAllNews] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [
          adResponse,
          homepageResponse,
          categoryResponse,
          allNewsResponse,
        ] = await Promise.all([
          getAdvertisementPool({
            cards: 0,
            strips: 2,
          }),

          getHomepageNews(),

          getPublicCategories(),

          fetchAllNews(),
        ]);

        // Advertisement
        setAds(adResponse);

        // Hero
        setHomepageNews(homepageResponse?.news || []);

        // Categories
        setCategories(categoryResponse || []);

        // Category showcase news
        setAllNews(allNewsResponse?.news || []);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      }
    };

    loadDashboard();
  }, []);

  return (
    <>
      <HeroSection
        articles={homepageNews}
      />

      <Advertisment
        adData={ads.strips[0] ?? null}
      />

      <LatestNews />

      <CategoryShowcase
        categories={categories}
        articles={allNews}
      />

      <Advertisment
        adData={ads.strips[1] ?? null}
      />
    </>
  );
};

export default UserDashboard;