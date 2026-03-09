import React from "react";
import { Outlet } from "react-router-dom";
import UserNavbar from "../UserNavbar/UserNavbar";
import UserFooter from "../UserFooter/UserFooter";

const UserLayout: React.FC = () => {
  return (
    <div className="user-layout">
      <UserNavbar />
      
      {/* <Outlet /> is where your page content magically swaps out! */}
      <main className="main-content">
        <Outlet /> 
      </main>

      <UserFooter />
    </div>
  );
};

export default UserLayout;