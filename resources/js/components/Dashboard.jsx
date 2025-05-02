import Layout from "./Layout";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Package, RotateCw, TrendingUp, ShoppingCart, RefreshCw, Wallet, Banknote, Wrench, TrendingDown, Box, Percent } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";

const Dashboard = () => {
  const [selectedDurationTopSection, setSelectedDurationTopSection] = useState("today");
  const [startDateTopSection, setStartDateTopSection] = useState(new Date());
  const [endDateTopSection, setEndDateTopSection] = useState(new Date());
  const [summaryTopSection, setSummaryTopSection] = useState({
    totalSales: 0.00,
    totalServices: 0.00,
    totalReceivables: 0.00,
    totalCost: 0.00,
    totalReturns: 0.00,
    totalExpenses: 0.00,
    totalVat: 0.00,
    totalIncome: 0.00,
  });

  const [selectedDurationMiddleSection, setSelectedDurationMiddleSection] = useState("today");
  const [salesTrends, setSalesTrends] = useState([
    { name: "", value: 0 },
    { name: "", value: 0 },
    { name: "", value: 0 },
  ]);
  const [expensesTrends, setExpensesTrends] = useState([
    { name: "", value: 0 },
    { name: "", value: 0 },
    { name: "", value: 0 },
  ]);
  const [topSellingProducts, setTopSellingProducts] = useState([
    { name: "Product", value: 0 },
    { name: "Product", value: 0 },
    { name: "Product", value: 0 },
  ]);
  const [leastSellingProducts, setLeastSellingProducts] = useState([
    { name: "Product", value: 0 },
    { name: "Product", value: 0 },
    { name: "Product", value: 0 },
  ]);

  const [selectedDurationBottomSection, setSelectedDurationBottomSection] = useState("today");
  const [recentSales, setRecentSales] = useState([]);
  const [recentRestocks, setRecentRestocks] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentReturns, setRecentReturns] = useState([]);
  const [recentServices, setRecentServices] = useState([]);  
  const [noneSellingProducts, setNoneSellingProducts] = useState([]);
  
  useEffect(() => {
    handleFilterTopSection();
    handleFilterMiddleSection();
    handleFilterBottomSection();
  }, []);

  const handleFilterTopSection = async () => {
    try {
      const authToken = localStorage.getItem("token");
      const response = await axios.get(`/api/dashboard/top-section`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: {
              selected: selectedDurationTopSection,
              startDate: startDateTopSection ? startDateTopSection.toISOString().split("T")[0] : "",
              endDate: endDateTopSection ? endDateTopSection.toISOString().split("T")[0] : "",
          },
      });
      if (response.status === 200 || response.status === 201) {
        const data = response.data; 
        setSummaryTopSection(prevState => ({
          ...prevState,
          totalSales: data.totalSales || prevState.totalSales,
          totalServices: data.totalServices || prevState.totalServices,
          totalReceivables: data.totalReceivables || prevState.totalReceivables,
          totalCost: data.totalCost || prevState.totalCost,
          totalReturns: data.totalReturns || prevState.totalReturns,
          totalExpenses: data.totalExpenses || prevState.totalExpenses,
          totalVat: data.totalVat || prevState.totalVat,
          totalIncome: data.totalIncome || prevState.totalIncome,
        }));
      }else{
        setSummaryTopSection(prevState => ({
          ...prevState,
          totalSales: 0.00,
          totalServices: 0.00,
          totalReceivables: 0.00,
          totalCost: 0.00,
          totalReturns: 0.00,
          totalExpenses: 0.00,
          totalVat: 0.00,
          totalIncome: 0.00,
        }));
      }
    } catch (error) {
    
    }
  };

  const handleFilterMiddleSection = async () => {
    try {
      const authToken = localStorage.getItem("token");
      const response = await axios.get(`/api/dashboard/middle-section`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: {
              selected: selectedDurationMiddleSection
          },
      });
      if (response.status === 200 || response.status === 201) {
        const data = response.data;
        if (data?.salesTrends?.length > 0) {
          setSalesTrends(data.salesTrends.map(item => ({
            name: item.name,
            value: item.value
          })));
        }else{
          setSalesTrends([
            { name: "", value: 0 },
            { name: "", value: 0 },
            { name: "", value: 0 },
          ]);
        }
        if (data?.expensesTrends?.length > 0) {
          setExpensesTrends(data.expensesTrends.map(item => ({
            name: item.name,
            value: item.value
          })));
        }else{
          setExpensesTrends([
            { name: "", value: 0 },
            { name: "", value: 0 },
            { name: "", value: 0 },
          ]);
        }
        if (data?.topSellingProducts?.length > 0) {
          setTopSellingProducts(data.topSellingProducts.map(item => ({
            name: item.name,
            value: item.value
          })));
        }else{
          setTopSellingProducts([
            { name: "", value: 0 },
            { name: "", value: 0 },
            { name: "", value: 0 },
          ]);
        }
        if (data?.leastSellingProducts?.length > 0) {
          setLeastSellingProducts(data.leastSellingProducts.map(item => ({
            name: item.name,
            value: item.value
          })));
        }else{
          setLeastSellingProducts([
            { name: "", value: 0 },
            { name: "", value: 0 },
            { name: "", value: 0 },
          ]);
        }
      }else{
        setSalesTrends([
          { name: "", value: 0 },
          { name: "", value: 0 },
          { name: "", value: 0 },
        ]);
        setExpensesTrends([
          { name: "", value: 0 },
          { name: "", value: 0 },
          { name: "", value: 0 },
        ]);
        setTopSellingProducts([
          { name: "", value: 0 },
          { name: "", value: 0 },
          { name: "", value: 0 },
        ]);
        setLeastSellingProducts([
          { name: "", value: 0 },
          { name: "", value: 0 },
          { name: "", value: 0 },
        ]);
      }
    } catch (error) {
    
    }
  };

  const handleFilterBottomSection = async () => {
    try {
      const authToken = localStorage.getItem("token");
      const response = await axios.get(`/api/dashboard/bottom-section`, {
          headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.status === 200 || response.status === 201) {
        const data = response.data;
        // console.error(data);
        if (data?.recentSales?.length > 0) {
          setRecentSales(data.recentSales);
        }
        if (data?.recentRestocks?.length > 0) {
          setRecentRestocks(data.recentRestocks);
        }
        if (data?.recentExpenses?.length > 0) {
          setRecentExpenses(data.recentExpenses);
        }
        if (data?.recentReturns?.length > 0) {
          setRecentReturns(data.recentReturns);
        }
        if (data?.recentServices?.length > 0) {
          setRecentServices(data.recentServices);
        }        
        if (data?.noneSellingProducts?.length > 0) {
          setNoneSellingProducts(data.noneSellingProducts);
        }
      } else {

      }
    } catch (error) {
    
    }
  };

  const PesoSign = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={props.size || 20}
        height={props.size || 20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
    >
        <path d="M4 4h12a5 5 0 0 1 0 10H4z" />
        <path d="M14 14H4v8" />
        <path d="M17 15h-6" />
        <path d="M17 9H4" />
    </svg>
  );

  const summaryDataTopSection = [
    { title: "Sales", value: summaryTopSection.totalSales, icon: <ShoppingCart size={20} />, bgColor: "bg-blue-100", textColor: "text-blue-600" },
    { title: "Services", value: summaryTopSection.totalServices, icon: <Wrench size={20} />, bgColor: "bg-purple-100", textColor: "text-purple-600" },
    { title: "Receivables", value: summaryTopSection.totalReceivables, icon: <Wallet size={20} />, bgColor: "bg-yellow-100", textColor: "text-yellow-600" },
    { title: "Cost", value: summaryTopSection.totalCost, icon: <Package size={20} />, bgColor: "bg-amber-100", textColor: "text-amber-600" },
    { title: "Returns", value: summaryTopSection.totalReturns, icon: <RefreshCw size={20} />, bgColor: "bg-orange-100", textColor: "text-orange-600" },
    { title: "Expenses", value: summaryTopSection.totalExpenses, icon: <TrendingDown size={20} />, bgColor: "bg-red-100", textColor: "text-red-600" },
    { title: "VAT", value: summaryTopSection.totalVat, icon: <Percent size={20} />, bgColor: "bg-indigo-100", textColor: "text-indigo-600" },
    { title: "Income", value: summaryTopSection.totalIncome, icon: <PesoSign size={20} />, bgColor: "bg-green-100", textColor: "text-green-600" },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  return (
    <Layout>
      <div className="flex items-center gap-4 mt-10">
        <select 
          value={selectedDurationTopSection} 
          onChange={(e) => setSelectedDurationTopSection(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        >
          <option value="today">Today</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>

        {selectedDurationTopSection === "custom" && (
          <>
          <DatePicker 
            selected={startDateTopSection} 
            onChange={(date) => setStartDateTopSection(date)} 
            className="border px-3 py-2 rounded-lg"
          />
          <span>to</span>
          <DatePicker 
            selected={endDateTopSection} 
            onChange={(date) => setEndDateTopSection(date)} 
            className="border px-3 py-2 rounded-lg"
          />
          </>
        )}
        <button 
            onClick={handleFilterTopSection} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
          >
          Filter
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3 mt-6">
        {summaryDataTopSection.map((item, index) => (
          <div
            key={index}
            className="p-5 rounded-xl border border-white-200 bg-white-50 shadow-lg backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105"
          >
            <div
              className={`w-12 h-12 flex items-center justify-center rounded-full ${item.bgColor} shadow-lg mb-3 transition-all duration-500 ease-in-out hover:-translate-y-2 hover:drop-shadow-2xl`}
            >
              {React.cloneElement(item.icon, { className: `text-2xl ${item.textColor}` })}
            </div>

            <h2 className="text-sm font-medium text-gray-600">{item.title}</h2>
            <p className="text-lg font-bold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>


      <div className="flex items-center gap-4 mt-10">
        <select 
          value={selectedDurationMiddleSection} 
          onChange={(e) => setSelectedDurationMiddleSection(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        >
          <option value="today">Today</option>
          <option value="last_10_days">Last 10 Days</option>
          <option value="this_month">This Month</option>
{/* 
          <option value="first_qtr">First Quarter (Jan - Mar)</option>
          <option value="second_qtr">Second Quarter (Apr - Jun)</option>
          <option value="third_qtr">Third Quarter (Jul - Sep)</option>
          <option value="fourth_qtr">Fourth Quarter (Oct - Dec)</option>

          <option value="first_sem">First Semester (Jan - Jun)</option>
          <option value="second_sem">Second Semester (Jul - Dec)</option> */}

          <option value="this_year_monthly">This Year (Monthly)</option>
          <option value="this_year_qtr">This Year (QTR Breakdown)</option>
          <option value="last_3_years">Last 3 Years</option>
          <option value="last_5_years">Last 5 Years</option>
          <option value="last_7_years">Last 7 Years</option>
        </select>        
        <button 
            onClick={handleFilterMiddleSection} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
          >
          Filter
        </button>
      </div>
      <div className="mt-4 pb-1 pr-7 rounded-xl border border-white-200 bg-white-50 shadow-lg backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100">
          <h2 className="text-lg font-semibold mb-3">📈 Sales Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
      </div>
      <div className="mt-4 pb-1 pr-7 rounded-xl border border-white-200 bg-white-50 shadow-lg backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100">
          <h2 className="text-lg font-semibold mb-3">💸 Expenses Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={expensesTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#FF5733" />
            </LineChart>
          </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-4">
        <div className="pb-1 pr-7 rounded-xl border border-white-200 bg-white-50 shadow-lg backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100">
          <h2 className="text-lg font-semibold mb-3">🔥 Top-Selling Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSellingProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="pb-1 pr-7 rounded-xl border border-white-200 bg-white-50 shadow-lg backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100">
          <h2 className="text-lg font-semibold mb-3">📉 Least Selling Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leastSellingProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#ff4d4d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        {/* None Selling Products */}
        <div className="p-5 rounded-xl border border-white-200 bg-white-50 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Box size={20} className="text-red-600" />
            Non-Selling Products
          </h2>
          {noneSellingProducts.length > 0 ? (
            <ul className="mt-3 space-y-2 max-h-60 overflow-auto">
              {noneSellingProducts.map((product) => (
                <li key={product.id} className="border-b pb-2 flex">
                  <div>
                    <p className="text-gray-700 font-medium">{product.name_variant}</p>
                    <p className="text-sm text-gray-500">
                      Price: ₱ {product.price}
                    </p>
                    <p className="text-sm text-gray-500">
                      Qty: {product.qty}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-gray-500 text-sm text-center">No products available.</p>
          )}
        </div>

        {/* Recent Sales Transactions */}
        <div className="p-5 rounded-xl border border-white-200 bg-white-50 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart size={20} className="text-blue-600" />
            Recent Sales Transactions
          </h2>

          {recentSales.length > 0 ? (
            <ul className="mt-3 space-y-2 max-h-60 overflow-auto">
              {recentSales.map((sale) => (
                <li key={sale.id} className="border-b pb-2 flex justify-between">
                  <div>
                    <p className="text-gray-700 font-medium">{sale.code}</p>
                    <p className="text-sm text-gray-500">
                      {moment(sale.date_time_of_sale).format("MMM D, YY h:mma")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">₱ {sale.total_amount}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-gray-500 text-sm text-center">No recent sales transactions.</p>
          )}
        </div>

        {/* Recent Services */}
        <div className="p-5 rounded-xl border border-white-200 bg-white-50 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wrench size={20} className="text-blue-400" />
            Recent Services
          </h2>
          {recentServices.length > 0 ? (
            <ul className="mt-3 space-y-2 max-h-60 overflow-auto">
              {recentServices.map((service) => (
                <li key={service.id} className="border-b pb-2 flex justify-between">
                  <div>
                    <p className="text-gray-700 font-medium">{service.service_info?.name}</p>
                    <p className="text-sm text-gray-500">
                      Customer: {service.customer_info?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {moment(service.created_at).format("MMM D, YY h:mma")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">₱ {service.amount}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-gray-500 text-sm text-center">No recent service.</p>
          )}
        </div>

        {/* Recent Product Restocks */}
        <div className="p-5 rounded-xl border border-white-200 bg-white-50 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package size={20} className="text-green-600" />
            Recent Product Restocks
          </h2>
          {recentRestocks.length > 0 ? (
            <ul className="mt-3 space-y-2 max-h-60 overflow-auto">
              {recentRestocks.map((restock) => (
                <li key={restock.id} className="border-b pb-2 flex justify-between">
                  <div>
                    <p className="text-gray-700 font-medium">{restock.name}</p>
                    <p className="text-sm text-gray-500">
                      {moment(restock.restock_date).format("MMM D, YY h:mma")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">₱ {restock.price}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-gray-500 text-sm text-center">No recent product restocks.</p>
          )}
        </div>
        
        {/* Recent Expenses */}
        <div className="p-5 rounded-xl border border-white-200 bg-white-50 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Banknote size={20} className="text-yellow-600" />
            Recent Expenses
          </h2>
          {recentExpenses.length > 0 ? (
            <ul className="mt-3 space-y-2 max-h-60 overflow-auto">
              {recentExpenses.map((expense) => (
                <li key={expense.id} className="border-b pb-2 flex justify-between">
                  <div>
                    <p className="text-gray-700 font-medium">{expense.expense_name}</p>
                    <p className="text-sm text-gray-500">
                      {moment(expense.date_time_of_expense).format("MMM D, YY h:mma")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">₱ {expense.amount}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-gray-500 text-sm text-center">No recent expenses.</p>
          )}
        </div>

        {/* Recent Returns */}
        <div className="p-5 rounded-xl border border-white-200 bg-white-50 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <RotateCw size={20} className="text-red-600" />
            Recent Returns
          </h2>
          {recentReturns.length > 0 ? (
            <ul className="mt-3 space-y-2 max-h-60 overflow-auto">
              {recentReturns.map((ret) => (
                <li key={ret.id} className="border-b pb-2 flex justify-between">
                  <div>
                    <p className="text-gray-700 font-medium">{ret.code}</p>
                    <p className="text-sm text-gray-500">
                      {moment(ret.date_time_returned).format("MMM D, YY h:mma")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">₱ {ret.total_amount}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-gray-500 text-sm text-center">No recent returns.</p>
          )}
        </div>
      </div>

    </Layout>
  );
};

export default Dashboard;
