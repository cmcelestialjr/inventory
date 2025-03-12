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

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedSupplierStatus, setSelectedSupplierStatus] = useState("all");
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [supplierId, setSupplierId] = useState(null);
    const [supplierName, setSupplierName] = useState(null);
    const [contactPerson, setContactPerson] = useState(null);
    const [contactNo, setContactNo] = useState(null);
    const [email, setEmail] = useState(null);
    const [status, setStatus] = useState("Active");

    useEffect(() => {
        fetchSuppliers(selectedSupplierStatus);
    }, [search, page, selectedSupplierStatus]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const fetchSuppliers = async (filter) => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/suppliers`, {
                params: {
                    search: search,
                    page: page,
                    filter: filter
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setSuppliers(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            // console.error("Error fetching suppliers:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!supplierName || !contactPerson || !contactNo) {
            toastr.error("Please input Supplier name, Contact Person and Contact No.!");
            return;
        }

        try {
            const formData = {
                supplierId: supplierId,
                supplierName: supplierName,
                contactPerson: contactPerson,
                contactNo: contactNo,
                email: email,
                status: status
            };
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/suppliers/manage`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                setSupplierId(null);
                setSupplierName(null);
                setContactPerson(null);
                setContactNo(null);
                setEmail(null);
                setStatus("Active");
                setIsSupplierModalOpen(false);
                fetchSuppliers();
            }else{
                toastr.error("Error! There is something wrong in saving supplier.");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "An error occurred while saving the supplier.";
            toastr.error(errorMessage);
        }
    };

    const handleSupplierNew = () => {
        setSupplierId(null);
        setSupplierName(null);
        setContactPerson(null);
        setContactNo(null);
        setEmail(null);
        setStatus("Active");
        setIsSupplierModalOpen(true);
    };

    const handleSupplierEdit = (supplier) => {
        setSupplierId(supplier.id);
        setSupplierName(supplier.name);
        setContactPerson(supplier.contact_person);
        setContactNo(supplier.contact_no);
        setEmail(supplier.email_address);
        setStatus(supplier.supplier_status);
        setIsSupplierModalOpen(true);        
    };

    const handleSupplierClose = () => {
        setSupplierId(null);
        setSupplierName(null);
        setContactPerson(null);
        setContactNo(null);
        setEmail(null);
        setStatus("Active");
        setIsSupplierModalOpen(false);
    };

    const formatPhoneNumber = (value) => {
        // Remove all non-digit characters
        const cleaned = value.replace(/\D/g, '').slice(0, 11); // limit to 11 digits
      
        // Format to: 0912 345 6789
        const match = cleaned.match(/^(\d{0,4})(\d{0,3})(\d{0,4})$/);
      
        if (!match) return cleaned;
      
        return [match[1], match[2], match[3]].filter(Boolean).join('-');
    };

    return (
        <Layout>
            <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto max-w-7xl mt-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Suppliers</h1>
                    <button
                        onClick={handleSupplierNew}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> New Supplier
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                {/* Supplier Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="border border-gray-300 px-4 py-2 text-left">Supplier</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Contact Person</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Contact</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.length > 0 ? (
                                suppliers.map((supplier, index) => (
                                    <tr key={supplier.id}>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {supplier.name}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">{supplier.contact_person}</td>
                                        <td className="border border-gray-300 px-4 py-2">{supplier.contact_no}</td>
                                        <td className="border border-gray-300 px-4 py-2">{supplier.email}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {supplier.supplier_status === "Active" && (
                                                    <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full">
                                                    Active
                                                    </span>
                                                )}
                                                {supplier.supplier_status === "Inactive" && (
                                                    <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full">
                                                    Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 gap-2">
                                                {/* <button onClick={() => openSaleViewModal(sale)}
                                                    className="flex items-center gap-1 text-green-800 hover:text-green-600 hover:underline">
                                                    <Eye size={16} /> View
                                                </button> */}
                                                <button onClick={() => handleSupplierEdit(supplier)}
                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline">
                                                    <Edit size={16} /> Edit
                                                </button>
                                            </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="border border-gray-300 px-4 py-2 text-center">
                                        No Supplier found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {meta && (
                    <div className="flex justify-between items-center mt-4">
                        <button
                            disabled={!meta.prev}
                            onClick={() => setPage(page - 1)}
                            className={`px-4 py-2 rounded-lg ${meta.prev ? "text-white bg-blue-600 hover:bg-blue-500" : "bg-gray-200 cursor-not-allowed"}`}
                        >
                            Previous
                        </button>
                        <span>
                            Page {meta.current_page} of {meta.last_page}
                        </span>
                        <button
                            disabled={!meta.next}
                            onClick={() => setPage(page + 1)}
                            className={`px-4 py-2 rounded-lg ${meta.next ? "text-white bg-blue-600 hover:bg-blue-500" : "bg-gray-200 cursor-not-allowed"}`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {isSupplierModalOpen && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative">
                        {/* Header */}
                        <div className="flex justify-between">
                            <h2 className="text-xl font-semibold">
                                {supplierId ? "Edit Supplier" : "New Supplier"}
                            </h2>
                            <button 
                                onClick={handleSupplierClose} 
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="mt-4">
                            {/* Supplier Name */}
                            <label className="block text-sm font-medium">Supplier Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={supplierName}
                                    onChange={(e) => setSupplierName(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Supplier Name..."
                                />
                            </div>
                            {/* Contact Person */}
                            <label className="block text-sm font-medium mt-2">Contact Person</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Contact Person..."
                                />
                            </div>
                            {/* Contact No */}
                            <label className="block text-sm font-medium mt-2">Contact No.:</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={contactNo}
                                    onChange={(e) => setContactNo(formatPhoneNumber(e.target.value))}
                                    className="w-full p-2 border rounded"
                                    placeholder="0912 345 6789"
                                />
                            </div>
                            {/* Email Address */}
                            <label className="block text-sm font-medium mt-2">Email Address:</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="example@email.com"
                                />
                            </div>
                            {/* Status */}
                            <label className="block text-sm font-medium mt-2">Status:</label>
                            <div className="relative">
                                <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full p-2 border rounded"
                                >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                Save Supplier
                            </button>

                        </form>

                    </div>
                </div>
            )}

        </Layout>
    );

};

export default Suppliers;