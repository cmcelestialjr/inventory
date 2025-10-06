import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import toastr from "toastr";
import 'toastr/build/toastr.min.css';
import Layout from "./Layout";
import { CheckCircle, Edit, Plus, Trash2, XCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AdvancesForm from "./AdvancesForm";
import AdvancesView from "./AdvancesView";

const Advances = () => {

    const [search, setSearch] = useState("");
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [advances, setAdvances] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState(1);
    const [viewModal , setViewModal ] = useState(false);
    const [selectedAdvance, setSelectedAdvance] = useState(null);
    const [formModal , setFormModal ] = useState(false);
    const [form, setForm] = useState({
        id: "",
        employee_id: "",
        advance_amount: 0,
        repayment_periods: 1,
        monthly_deduction: 0,
        status_id: 1,
    });

    const colors = [
        "bg-blue-500",
        "bg-yellow-500",
        "bg-green-800",
        "bg-red-500",
    ];

    const textColors = [
        "text-blue-500",
        "text-yellow-800",
        "text-green-800",
        "text-red-800",
    ];

    const didFetch = useRef(false);
    
    useEffect(() => {
        if (didFetch.current) return;
        didFetch.current = true;
        
        fetchStatuses();
    }, []);

    useEffect(() => {
        fetchAdvances(selectedStatus);
    }, [search, year, selectedStatus]);

    const handleSelectedStatus = (id) => {
        setSelectedStatus(id);
    };
    
    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const fetchStatuses = async () => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get("/api/advanceStatuses", {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setStatuses(response.data.data);
        } catch (error) {
          // console.error("Error fetching:", error);
        }
    };

    const fetchAdvances = async (status) => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/advances`, {
                params: {
                    search: search,
                    year: year,
                    status: status,
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setAdvances(response.data.data);
        } catch (error) {
            // console.error("Error fetching:", error);
        }
    };

    const handleView = (advance) => {
        setSelectedAdvance(advance);
        setViewModal(true);
    };

    const handleForm = (advance) => {
        setFormModal(true);
        setForm(advance);
    };

    const closeModal = () => {
        setForm({
            id: "",
            employee_id: "",
            advance_amount: 0,
            repayment_periods: 1,
            monthly_deduction: 0,
            status_id: 1,
        });
        setFormModal(false);
    };

    const closeViewModal = () => {
        setSelectedAdvance([]);
        setViewModal(false);
    };

    return (
        <Layout>
            <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Cash Advances</h1>
                    <button
                        onClick={() => handleForm(form)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> New Cash Advance
                    </button>
                </div>
                
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {statuses.map((status, index) => {
                        const buttonColor = colors[index % colors.length];
                        return (
                            <button
                                key={status.id}
                                onClick={() => handleSelectedStatus(status.id)}
                                className={`flex flex-col items-center p-5 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                                    selectedStatus === status.id 
                                        ? `${buttonColor} text-white shadow-xl` 
                                        : `bg-white border border-gray-300 hover:bg-gray-100`
                                }`}
                            >
                                <span className="text-sm font-semibold">{status.name}</span>
                                <span className="text-xl font-bold">
                                    {/* {saleStatus.sales_count} */}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search advances..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Single Calendar for Date Range */}
                    <DatePicker
                        selected={year ? new Date(year, 0) : null}
                        onChange={(date) => {
                            const selectedYear = date.getFullYear();
                            setYear(selectedYear);
                        }}
                        showYearPicker
                        dateFormat="yyyy"
                        placeholderText="Select year"
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {advances.map((advance, index) => {
                        const textColor = textColors[(advance.status?.id - 1) % textColors.length];
                        return (
                        <div
                            key={advance.id}
                            className="border p-4 rounded-lg shadow-md bg-white hover:bg-gray-50 flex items-start transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                            <div className="flex flex-col w-full">
                                <div className="flex justify-between items-start">
                                    <div className="w-full">
                                        <p className="text-lg font-semibold text-gray-900 flex justify-between w-full">
                                            Code: 
                                            <span className="font-medium text-gray-800">
                                                {advance.code}
                                            </span>
                                        </p>
                                        <p className="text-sm text-gray-700 flex justify-between w-full">
                                            Name:
                                            <span className="font-medium text-gray-800">
                                                {advance.employee?.lastname}, {advance.employee?.firstname} {advance.employee?.extname} 
                                                {advance.employee?.middlename && (
                                                    <span className="ml-1">
                                                        {advance.employee.middlename.charAt(0)}.
                                                    </span>
                                                )}
                                            </span>
                                        </p>
                                        <p className="text-sm text-gray-700 flex justify-between w-full">
                                        Advance amount: <span className="font-medium">
                                            {advance.advance_amount > 0 ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(advance.advance_amount) : 0}
                                        </span>
                                        </p>
                                        <p className="text-sm text-gray-700 flex justify-between w-full">
                                        Repayment Period/s: <span className="font-medium">
                                            {advance.repayment_periods}
                                        </span>
                                        </p>
                                        <p className="text-sm text-gray-700 flex justify-between w-full">
                                        Monthly Deduction: <span className="font-medium">
                                            {advance.monthly_deduction > 0 ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(advance.monthly_deduction) : 0}
                                        </span>
                                        </p>
                                        <p className="text-sm text-gray-700 flex justify-between w-full">
                                        Remaining: <span className="font-medium">
                                            {advance.advance_amount - advance.total_deducted > 0 ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(advance.advance_amount - advance.total_deducted) : 0}
                                        </span>
                                        </p>
                                        <p className="text-sm text-gray-700 flex justify-between w-full">
                                        Status: <span className={`font-medium ${textColor}`}>{advance.status?.name}</span>
                                        </p>

                                        
                                        <div className="flex space-x-4 mt-1">
                                            <button
                                                className="bg-blue-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                                                onClick={() => handleView(advance)}
                                            >
                                                View
                                            </button>

                                            <button
                                                className="bg-yellow-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => handleForm(advance)}
                                                disabled={advance.deductions?.some(d => d.payroll_id !== null)}
                                            >
                                            Edit
                                            </button>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>

                <AdvancesForm 
                    formModal={formModal}
                    form={form}
                    setForm={setForm}
                    fetchAdvances={fetchAdvances}
                    closeModal={closeModal}
                />

                <AdvancesView
                    viewModal={viewModal}
                    selectedAdvance={selectedAdvance}
                    closeViewModal={closeViewModal}
                />
                
            </div>
        </Layout>
    );
};

export default Advances;
