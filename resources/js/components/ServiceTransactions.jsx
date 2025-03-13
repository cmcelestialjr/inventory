import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Layout from "./Layout";
import { Edit, Eye, Plus, X, Package, RotateCcw, ShoppingBag, Repeat, AlertTriangle, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import moment from "moment";
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ServiceTransactions = () => {
    const [services, setServices] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [selectedServiceStatus, setSelectedServiceStatus] = useState("all");

    useEffect(() => {
        fetchServices(selectedServiceStatus);
    }, [search, page, selectedServiceStatus]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const fetchServices = async (filter) => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/services`, {
                params: {
                    search: search,
                    page: page,
                    filter: filter,
                    start_date: startDate ? startDate.toISOString().split("T")[0] : null,
                    end_date: endDate ? endDate.toISOString().split("T")[0] : null
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setServices(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            // console.error("Error fetching sales:", error);
        }
    };

    return (
        <Layout>
            <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto max-w-7xl mt-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Services</h1>
                    <button
                        // onClick={() => setIsNewSaleModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> New Service
                    </button>
                </div>

                

            </div>
        </Layout>
    );

};

export default ServiceTransactions;