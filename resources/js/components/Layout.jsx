import React from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 min-h-screen p-4 md:ml-64 transition-all duration-300">
        {children}
      </div>
    </div>
  );
};

export default Layout;
