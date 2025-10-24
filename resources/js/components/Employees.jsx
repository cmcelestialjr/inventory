import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import toastr from "toastr";
import 'toastr/build/toastr.min.css';
import Layout from "./Layout";
import { CheckCircle, Clock10Icon, Clock4, Edit, Plus, Receipt, Trash2, Wallet, XCircle } from "lucide-react";
import EmployeeForm from "./EmployeeForm";
import EmployeeWages from "./EmployeeWages";

const Employees = () => {
    const authToken = localStorage.getItem("token");
    const [employees, setEmployees] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("Active");
    const [formModal, setFormModal] = useState(false);
    const [wagesModal, setWagesModal] = useState(false);
    const [wages, setWages] = useState(false);
    const [totals, setTotals] = useState({
        active: 0,
        inactive: 0
    });
    const [form, setForm] = useState({
        id: "",
        employee_no: "",
        lastname: "",
        firstname: "",
        middlename: "",
        extname: "",
        contact_no: "",
        email: "",
        position: "",
        salary: "",
        employment_status: "",
        dob: "",
        status: "Active",
        sex: "Male",
        address: "",
        picture: "",
    });
    const didFetch = useRef(false);
    
    useEffect(() => {
        if (didFetch.current) return;
        didFetch.current = true;
            
    }, []);

    useEffect(() => {
        fetchTotals();
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [search, page, status]);

    const fetchEmployees = async () => {
        try {            
            const response = await axios.get(`/api/employees`, {
                params: {
                    search: search,
                    page: page,
                    status: status
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setEmployees(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            // console.error("Error fetching damaged:", error);
        }
    };

    const fetchTotals = async () => {
        try {            
            const response = await axios.get(`/api/employees/totals`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setTotals(response.data.data);
        } catch (error) {
            // console.error("Error fetching damaged:", error);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleStatus = (filter) => {
        setStatus(filter);
        setPage(1);
    };

    const handleForm = (employee) => {
        setFormModal(true);
        setForm(employee);
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete Employee?",
            text: "This action cannot be undone",
            icon: "warning",
            showCancelButton: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                await axios.delete(`/api/employees/${id}`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
                toastr.success("Employee deleted!");
                fetchEmployees();
            }
        });
    };

    const handleWages = (employee) => {
        setWagesModal(true);
        setWages(employee);
    };

    return (
        <Layout>
            <div className="w-full mt-10 mx-auto">
                <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-4">
                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-800 capitalize">
                            Employees
                        </h1>
                        <button
                            onClick={() => handleForm(form)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                        >
                            <Plus size={18} /> New Employee
                        </button>
                    </div>

                    {/* Status Filter Buttons */}
                    <div className="flex gap-2 sm:gap-4 mb-3">
                        <button
                            onClick={() => handleStatus("Active")}
                            className={`flex flex-col items-center p-2 sm:p-6 sm:px-8 rounded-xl shadow-md transition transform hover:scale-105 w-full sm:w-auto ${
                                status === "Active" ? "bg-blue-600 text-white" : "bg-white border border-gray-300"
                            }`}
                            >
                            <CheckCircle size={24} className={`${status === "Active" ? "text-white" : "text-blue-600"}`} />
                            <span className="text-xs sm:text-sm font-semibold mt-1">Active</span>
                            <span className="text-sm sm:text-lg font-bold">{totals.active}</span>
                        </button>
                        <button
                            onClick={() => handleStatus("Inactive")}
                            className={`flex flex-col items-center p-2 sm:p-6 sm:px-8 rounded-xl shadow-md transition transform hover:scale-105 w-full sm:w-auto ${
                                status === "Inactive" ? "bg-red-600 text-white" : "bg-white border border-gray-300"
                            }`}
                            >
                            <XCircle size={24} className={`${status === "Inactive" ? "text-white" : "text-red-600"}`} />
                            <span className="text-xs sm:text-sm font-semibold mt-1">Inactive</span>
                            <span className="text-sm sm:text-lg font-bold">{totals.inactive}</span>
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="grid grid-cols-1 gap-4 mb-4">
                        <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        {/* Desktop Table View */}
                        <table className="hidden md:table w-full border-collapse border border-gray-300">
                            <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">Employee No</th>
                                <th className="border p-2">Img</th>
                                <th className="border p-2">Name</th>
                                <th className="border p-2">Contact No.</th>
                                <th className="border p-2">Position</th>
                                <th className="border p-2">Salary</th>
                                <th className="border p-2">Status</th>
                                <th className="border p-2">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.id}>
                                <td className="border p-2 text-center">{emp.employee_no}</td>
                                <td className="border p-2">
                                    <div className="flex justify-center">
                                    <img
                                        src={emp.picture}
                                        alt={emp.employee_no}
                                        className="w-14 h-14 rounded-full object-cover shadow-md ring-2 ring-gray-300 bg-gray-100"
                                    />
                                    </div>
                                </td>
                                <td className="border p-2">{emp.lastname}, {emp.firstname} {emp.extname} {emp.middlename}</td>
                                <td className="border p-2 text-center">{emp.contact_no}</td>
                                <td className="border p-2">{emp.position}</td>
                                <td className="border p-2 text-right">{emp.salary?.toLocaleString('en-US')}</td>
                                <td className="border p-2 text-center">
                                    {emp.status === "Active" ? (
                                    <span className="bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">Active</span>
                                    ) : (
                                    <span className="bg-gray-100 text-gray-600 font-semibold px-2 py-1 rounded-full">Inactive</span>
                                    )}
                                </td>
                                <td className="border p-2">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handleForm(emp)}
                                            className="bg-yellow-500 text-xs text-white px-3 py-2 rounded-md shadow hover:bg-yellow-400 flex items-center gap-1"
                                        >
                                            <Edit size="11" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(emp.id)}
                                            className="bg-red-600 text-xs text-white px-3 py-2 rounded-md shadow hover:bg-red-400 flex items-center gap-1"
                                        >
                                            <Trash2 size="11" /> Delete
                                        </button>
                                        <button
                                            onClick={() => handleWages(emp)}
                                            className="bg-green-600 text-xs text-white px-3 py-2 rounded-md shadow hover:bg-green-500 flex items-center gap-1"
                                        >
                                            <Wallet size="11" /> Wages
                                        </button>
                                    </div>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {employees.map((emp) => (
                            <div key={emp.id} className="border rounded-lg p-3 shadow-sm bg-white">
                                <div className="flex items-center gap-3">
                                <img
                                    src={emp.picture}
                                    alt={emp.employee_no}
                                    className="w-14 h-14 rounded-full object-cover shadow ring-2 ring-gray-300"
                                />
                                <div className="flex-1">
                                    <h3 className="font-semibold">
                                        {emp.lastname}, {emp.firstname}
                                        {emp.extname ? ` ${emp.extname}` : ''} 
                                        {emp.middlename ? ` ${emp.middlename.charAt(0)}.` : ''}
                                    </h3>
                                    <p className="text-sm text-gray-500">{emp.position}</p>
                                    <p className="text-sm text-gray-500">Emp No: {emp.employee_no}</p>
                                </div>
                                {emp.status === "Active" ? (
                                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Active</span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">Inactive</span>
                                )}
                                </div>

                                <div className="mt-2 text-sm">
                                <p><strong>Contact:</strong> {emp.contact_no}</p>
                                <p><strong>Salary:</strong> ₱{(emp.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>

                                <div className="flex justify-end gap-2 mt-3">
                                <button
                                    onClick={() => handleForm(emp)}
                                    className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-md shadow hover:bg-yellow-400 flex items-center gap-1"
                                >
                                    <Edit size="11" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(emp.id)}
                                    className="bg-blue-600 text-white text-xs px-3 py-1 rounded-md shadow hover:bg-red-500 flex items-center gap-1"
                                >
                                    <Trash2 size="11" /> Delete
                                </button>
                                <button
                                    onClick={() => handleWages(emp)}
                                    className="bg-green-600 text-white text-xs px-3 py-1 rounded-md shadow hover:bg-green-500 flex items-center gap-1"
                                >
                                    <Wallet size="11" /> Wages
                                </button>
                                </div>
                            </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {meta && (
                            <div className="flex justify-between items-center mt-3">
                            <button
                                disabled={!meta.prev}
                                onClick={() => setPage(page - 1)}
                                className={`px-2 py-1 text-sm rounded-lg ${meta.prev ? "text-white bg-blue-600 hover:bg-blue-500" : "bg-gray-200 cursor-not-allowed"}`}
                            >
                                Previous
                            </button>
                            <span className="text-sm">Page {meta.current_page} of {meta.last_page}</span>
                            <button
                                disabled={!meta.next}
                                onClick={() => setPage(page + 1)}
                                className={`px-2 py-1 text-sm rounded-lg ${meta.next ? "text-white bg-blue-600 hover:bg-blue-500" : "bg-gray-200 cursor-not-allowed"}`}
                            >
                                Next
                            </button>
                            </div>
                        )}
                    </div>
                </div>
                

                <EmployeeForm 
                    formModal={formModal}
                    setFormModal={setFormModal}
                    form={form} 
                    setForm={setForm}
                    fetchEmployees={fetchEmployees}
                />

                <EmployeeWages
                    wagesModal={wagesModal}
                    setWagesModal={setWagesModal}
                    wages={wages}
                    fetchEmployees={fetchEmployees}
                />
            </div>
        </Layout>
    );
};

export default Employees;
