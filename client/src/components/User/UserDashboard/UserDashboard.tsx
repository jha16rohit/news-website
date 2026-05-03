import React from "react";
import HeroSection from "../HomeHero/HomeHero";
import LatestNews from "../LatestNews/LatestNews";
import Advertisment from "../Advertisment/Advertisment";  
import "./UserDashboard.css";
import CategoryShowcase from "../CategoryShowcase/CategoryShowcase";


const UserDashboard: React.FC = () => {
  return (
    <>
      <HeroSection />
      <Advertisment page="home" />
      <LatestNews />
      <CategoryShowcase />
      <Advertisment page="home" />
    </>
  );
};

export default UserDashboard;