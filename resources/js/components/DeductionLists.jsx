import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus } from "lucide-react";
import Swal from "sweetalert2";
import toastr from "toastr";
import 'toastr/build/toastr.min.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DeductionForm from "./DeductionForm";

const DeductionLists = ({}) => {

    const [deductions, setDeductions] = useState([]);    
    const [search, setSearch] = useState("");
    const [formModal , setFormModal ] = useState(false);
    const [form, setForm] = useState({
        id: "",
        name: "",
        group: "",
        type: "amount",
        amount: 0,
        percentage: 0,
        ceiling: 0,
    });
    
    useEffect(() => {
        fetchDeductions();
    }, [search]);

    const fetchDeductions = async () => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/deductions`, {
                params: {
                    search: search
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setDeductions(response.data.data);
        } catch (error) {
            // console.error("Error fetching deduction:", error);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleForm = (employee) => {
        setFormModal(true);
        setForm(employee);
    };

    const closeModal = () => {
        setForm({
            id: "",
            name: "",
            group: "",
            type: "amount",
            amount: 0,
            percentage: 0,
            ceiling: 0,
        });
        setFormModal(false);
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete Deduction?",
            text: "This action cannot be undone",
            icon: "warning",
            showCancelButton: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                const authToken = localStorage.getItem("token");
                await axios.delete(`/api/deductions/${id}`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
                toastr.success("Deduction deleted!");
                fetchDeductions();
            }
        });
    };    

    return (
        <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-4">
            <div className="flex justify-between mb-4 gap-4">
                <div className="flex items-center w-full">
                    <input
                        type="text"
                        placeholder="Search deduction..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={() => handleForm(form)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 transition whitespace-nowrap"
                >
                    <Plus size={18} /> New Deduction
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {deductions.map((deduction, index) => (
                    <div
                        key={deduction.id}
                        className="border p-4 rounded-lg shadow-md bg-white hover:bg-gray-50 flex items-start transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        <div className="flex flex-col w-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-lg font-semibold text-gray-900">{deduction.name}</p>
                                    <p className="text-sm text-gray-700">
                                        Group:{" "}
                                        <span className={`font-medium ${!deduction.group ? 'text-gray-500' : 'text-gray-800'}`}>
                                            {deduction.group || 'n/a'}
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-700">Type: <span className="font-medium">{deduction.type}</span></p>
                                    
                                    {deduction.type === "amount" ? (
                                        <p className="text-sm text-gray-700">
                                            Amount:{" "}
                                            <span className={`font-medium ${deduction.amount > 0 ? 'text-gray-800' : 'text-gray-500'}`}>
                                            {deduction.amount > 0
                                                ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(deduction.amount)
                                                : 'n/a'}
                                            </span>
                                        </p>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-700">
                                            Percentage: <span className="font-semibold text-gray-900">{deduction.percentage}%</span>
                                            </p>
                                            <p className="text-sm text-gray-700">
                                            Ceiling:{" "}
                                            <span className={`font-medium ${deduction.ceiling > 0 ? 'text-gray-800' : 'text-gray-500'}`}>
                                                {deduction.ceiling > 0 
                                                ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(deduction.ceiling)
                                                : 'n/a'}
                                            </span>
                                            </p>
                                        </>
                                    )}
                                    
                                    <div className="flex space-x-4 mt-1">
                                        <button
                                            className="bg-blue-500 text-white py-1 px-2 rounded-lg text-xs hover:bg-blue-600 transition-colors"
                                            onClick={() => handleView(deduction)}
                                        >
                                            View
                                        </button>

                                        <button
                                            className="bg-yellow-500 text-white py-1 px-2 rounded-lg text-xs hover:bg-yellow-600 transition-colors"
                                            onClick={() => handleForm(deduction)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className={`text-white py-1 px-2 rounded-lg text-xs transition-colors ${
                                                (deduction.payrolls?.length > 0 || deduction.employees?.length > 0)
                                                ? 'bg-red-400 opacity-50 cursor-not-allowed'
                                                : 'bg-red-700 hover:bg-red-600'
                                            }`}
                                            onClick={() => handleDelete(deduction.id)}
                                            disabled={deduction.payrolls?.length > 0 || deduction.employees?.length > 0}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <DeductionForm 
                formModal={formModal}
                form={form}
                setForm={setForm}
                fetchDeductions={fetchDeductions}
                closeModal={closeModal}
            />

        </div>
    );
};

export default DeductionLists;