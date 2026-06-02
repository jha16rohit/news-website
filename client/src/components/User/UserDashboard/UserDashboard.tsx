import React, { useEffect, useState } from "react";
import HeroSection from "../HomeHero/HomeHero";
import LatestNews from "../LatestNews/LatestNews";
import Advertisment from "../Advertisment/Advertisment";
import CategoryShowcase from "../CategoryShowcase/CategoryShowcase";
import Preloader from "../../Admin/Preloader/Preloder";

const UserDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Preloader />;
  }

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