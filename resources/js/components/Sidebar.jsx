import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, 
        LayoutDashboard, 
        ShoppingCart,
        Undo,
        Boxes, 
        User, 
        Truck,
        Banknote,
        Settings, 
        LogOut } 
        from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation(); // Get current path

  // Function to check if a link is active
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Menu Button (for mobile) */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-white text-black border-r shadow-md z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-64"
        } md:translate-x-0`}
      >
        <div className="text-center mb-5 mt-3">
            <img src="/images/clstldev2.png" alt="Logo" className="mx-auto w-20 h-20" />
        </div>
        <nav>
          <ul className="space-y-4 px-5">
            <li>
              <Link 
                to="/dashboard" 
                className={`flex items-center p-2 rounded transition ${
                  isActive("/dashboard") ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                }`}
              >
                <LayoutDashboard size={20} className="mr-2" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/sales" 
                className={`flex items-center p-2 rounded transition ${
                  isActive("/sales") ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                }`}
              >
                <ShoppingCart size={20} className="mr-2" />
                Sales
              </Link>
            </li>
            <li>
              <Link 
                to="/returns"
                className={`flex items-center p-2 rounded transition ${
                  isActive("/returns") ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                }`}
              >
                <Undo size={20} className="mr-2" />
                Returns
              </Link>
            </li>
            <li>
              <Link 
                to="/products" 
                className={`flex items-center p-2 rounded transition ${
                  isActive("/products") ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                }`}
              >
                <Boxes size={20} className="mr-2" />
                Products
              </Link>
            </li>
            <li>
              <Link 
                to="/suppliers" 
                className={`flex items-center p-2 rounded transition ${
                  isActive("/suppliers") ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                }`}
              >
                <Truck size={20} className="mr-2" />
                Suppliers
              </Link>
            </li>
            <li>
              <Link 
                to="/expenses" 
                className={`flex items-center p-2 rounded transition ${
                  isActive("/expenses") ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                }`}
              >
                <Banknote size={20} className="mr-2" />
                Expenses
              </Link>
            </li>
            <li>
              <Link 
                to="/settings" 
                className={`flex items-center p-2 rounded transition ${
                  isActive("/settings") ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                }`}
              >
                <Settings size={20} className="mr-2" />
                Settings
              </Link>
            </li>
            <li>
              <Link 
                to="/logout" 
                className={`flex items-center p-2 rounded transition text-red-500 ${
                  isActive("/logout") ? "bg-red-500 text-white" : "hover:bg-gray-100"
                }`}
              >
                <LogOut size={20} className="mr-2" />
                Logout
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
