import React from "react";
import HeroSection from "../HomeHero/HomeHero";
import LatestNews from "../LatestNews/LatestNews";
import LiveCoverage from "../LiveCoverage/LiveCoverage";
import TrendingToday from "../TrendingToday/TrendingToday";
import Videos from "../Videos/Videos";
import Newsletter from "../NewsLetter/NewsLetter";
import Advertisment from "../Advertisment/Advertisment";  
import "./UserDashboard.css";

const UserDashboard: React.FC = () => {
  const adminAdData = {
    imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=1200", 
    linkUrl: "https://your-sponsor-link.com",
    altText: "Premium Advertisement"
  };

  return (
    <>
      <HeroSection />
      <Advertisment adData={adminAdData} />
      <LatestNews />
      <LiveCoverage />
      <Advertisment adData={adminAdData} />
      <TrendingToday />
      <Videos />
      <Advertisment adData={adminAdData} />
      <Newsletter />
    </>
  );
};

export default UserDashboard;