import React from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-4 md:ml-64 overflow-y-auto">
        <div className="min-h-full">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
