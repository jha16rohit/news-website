import React, { useCallback, useEffect, useRef, useState } from "react";

import HeroSection from "../HomeHero/HomeHero";
import LatestNews from "../LatestNews/LatestNews";
import Advertisment from "../Advertisment/Advertisment";
import CategoryShowcase from "../CategoryShowcase/CategoryShowcase";

import {
  getAdvertisementPool,
  type Advertisement,
} from "../../../api/user/advertisementPool";

import {
  getHomepageNews,
  getHomepageShowcase,
} from "../../../api/user/news";

import { getTrendingNews } from "../../../api/user/trendingNews";

import { useHomepageLoading } from "../UserLayout/UserLayout";

const HOMEPAGE_LOAD_TIMEOUT_MS = 15000;

const UserDashboard: React.FC = () => {
  const { setIsHomepageLoading } = useHomepageLoading();

  const [ads, setAds] = useState<{
    cards: Advertisement[];
    strips: Advertisement[];
  }>({
    cards: [],
    strips: [],
  });

  const [homepageNews, setHomepageNews] = useState<any[]>([]);
  const [showcaseCategories, setShowcaseCategories] = useState<any[]>([]);
  const [trendingNews, setTrendingNews] = useState<any[]>([]);

  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const clearSafetyTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const markDataReady = useCallback(() => {
    clearSafetyTimeout();
    setIsHomepageLoading(false);
  }, [setIsHomepageLoading, clearSafetyTimeout]);

  useEffect(() => {
    mountedRef.current = true;

    const controller = new AbortController();
    controllerRef.current = controller;

    const loadDashboard = async () => {
      try {
        const signal = controller.signal;
        const [
          adResponse,
          homepageResponse,
          showcaseResponse,
          trendingResponse,
        ] = await Promise.all([
          getAdvertisementPool(
            {
              cards: 0,
              strips: 2,
            },
            signal
          ),
          getHomepageNews(signal),
          getHomepageShowcase(signal),
          getTrendingNews(signal),
        ]);

        if (!mountedRef.current) return;

        setAds(adResponse);

        setHomepageNews(homepageResponse?.news || []);

        setShowcaseCategories(showcaseResponse?.categories || []);

        const trendingArticles = Array.isArray(trendingResponse?.news)
          ? trendingResponse.news
          : [];
        setTrendingNews(trendingArticles);

        markDataReady();
      } catch (err: any) {
        if (!mountedRef.current) return;

        if (err?.name === "AbortError") return;

        console.error("Failed to load dashboard:", err);

        markDataReady();
      }
    };

    loadDashboard();

    // Safety timeout: 15 seconds maximum. Fallback only — primary trigger
    // is actual data readiness via markDataReady().
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        console.warn(
          "Homepage data load timed out after 15s; revealing homepage with available data."
        );
        markDataReady();
      }
    }, HOMEPAGE_LOAD_TIMEOUT_MS);

    return () => {
      mountedRef.current = false;
      clearSafetyTimeout();
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [setIsHomepageLoading, markDataReady, clearSafetyTimeout]);

  return (
    <>
      <HeroSection articles={homepageNews} />

      <Advertisment adData={ads.strips[0] ?? null} />

      <LatestNews trendingNews={trendingNews} />

      <CategoryShowcase showcaseCategories={showcaseCategories} />

      <Advertisment adData={ads.strips[1] ?? null} />
    </>
  );
};

export default UserDashboard;