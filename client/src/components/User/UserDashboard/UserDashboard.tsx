import React from "react";
import HeroSection from "../HomeHero/HomeHero";
import LatestNews from "../LatestNews/LatestNews";
import Videos from "../Videos/Videos";
import Newsletter from "../NewsLetter/NewsLetter";
import Advertisment from "../Advertisment/Advertisment";  
import "./UserDashboard.css";
import CategoryShowcase from "../CategoryShowcase/CategoryShowcase";

const UserDashboard: React.FC = () => {
  return (
    <>
      <HeroSection />
      <Advertisment/>
      <LatestNews />
      <CategoryShowcase />
      <Videos/>
      <Advertisment/>
      <Newsletter />
    </>
  );
};

export default UserDashboard;