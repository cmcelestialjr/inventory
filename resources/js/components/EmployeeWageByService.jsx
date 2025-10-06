import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit, Plus, Save, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import EmployeeWageByServiceForm from "./EmployeeWageByServiceForm";

const EmployeeWageByService = ({ activeTab, wages, fetchEmployees, setWagesModal }) => {
    if (activeTab!='By Service') return null;

    const authToken = localStorage.getItem("token");
    const [serviceRates, setServiceRates] = useState([]);
    const [formModal, setFormModal] = useState(false);
    const [form, setForm] = useState({
            id: "",
            employee_id: "",
            service_id: "",
            service_amount_rate: 0.00,
            service_percentage_rate: 0.00,
            rate_type: "amount",
        });

    useEffect(() => {
        if (wages.id) {
            setForm((prev) => ({
                ...prev,
                employee_id: wages.id,
            }));
        }
    }, [wages.id]);

    useEffect(() => {
        fetchServiceRates();
    }, []);

    const fetchServiceRates = async () => {
        try {            
            const response = await axios.get(`/api/employee-services-rate`, {
                params: {
                    id: wages.id,
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setServiceRates(response.data.data);
        } catch (error) {
            // console.error("Error fetching damaged:", error);
        }
    };

    const handleForm = (employee) => {
        setFormModal(true);
        setForm(employee);
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete Employee Service Rate?",
            text: "This action cannot be undone",
            icon: "warning",
            showCancelButton: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                await axios.delete(`/api/employee-services-rate/${id}`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
                toastr.success("Employee Service Rate deleted!");
                setServiceRates(prevRates => prevRates.filter(rate => rate.id !== id));
                fetchEmployees();
            }
        });
    };

    const formatPeso = (v) =>
        v == null || v === ''
            ? ''
            : `₱${Number(String(v).replace(/[^\d.-]/g, '')).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;

    return (
        <div className="mt-3">
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => handleForm(form)}
                    className="flex items-center text-md gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> New Service Rate
                </button>
            </div>

            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto relative w-full">
                {/* Desktop Table View */}
                <table className="hidden md:table w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Service</th>
                            <th className="border p-2">Service Price</th>
                            <th className="border p-2">Rate</th>
                            <th className="border p-2">Type</th>
                            <th className="border p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {serviceRates.map((rate) => (
                            <tr key={rate.id}>
                                <td className="border p-2 text-center">{rate.service?.name}</td>
                                <td className="border p-2 text-right">{formatPeso(rate.service?.price)}</td>
                                <td className="border p-2 text-right">
                                    {rate.rate_type === 'percentage'
                                        ? `${((Number(rate.service?.price) || 0) * (Number(rate.service_percentage_rate) || 0) / 100).toFixed(2)} (${Number(rate.service_percentage_rate) % 1 === 0 ? formatPeso(rate.service_percentage_rate) : formatPeso(rate.service_percentage_rate) }%)`
                                        : formatPeso(rate.service_amount_rate)
                                    }
                                </td>
                                <td className="border p-2 text-center">{rate.rate_type}</td>
                                <td className="border p-2">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handleForm(rate)}
                                            className="bg-yellow-500 text-white px-3 py-2 rounded-md shadow hover:bg-yellow-400 flex items-center gap-1"
                                        >
                                            <Edit size="14" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rate.id)}
                                            className="bg-red-600 text-white px-3 py-2 rounded-md shadow hover:bg-red-500 flex items-center gap-1"
                                        >
                                            <Trash2 size="14" /> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {serviceRates.length > 0 ? (
                        serviceRates.map((rate) => (
                        <div key={rate.id} className="border rounded-lg p-3 shadow-sm bg-white">
                            <div className="mt-2 text-sm">
                            <p><strong>Service:</strong> {rate.service?.name}</p>
                            <p><strong>Service Price:</strong>{formatPeso(rate.service?.price)}</p>
                            <p><strong>Rate:</strong>
                                {rate.rate_type === 'percentage'
                                    ? `${((Number(rate.service?.price) || 0) * (Number(rate.service_percentage_rate) || 0) / 100).toFixed(2)} (${Number(rate.service_percentage_rate) % 1 === 0 ? formatPeso(rate.service_percentage_rate) : formatPeso(rate.service_percentage_rate) }%)`
                                    : formatPeso(rate.service_amount_rate)
                                }
                            </p>
                            <p><strong>Type:</strong> {rate.rate_type}</p>
                            </div>

                            <div className="flex justify-end gap-2 mt-3">
                            <button
                                onClick={() => handleForm(rate)}
                                className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-md shadow hover:bg-yellow-400 flex items-center gap-1"
                            >
                                <Edit size="14" /> Edit
                            </button>
                            <button
                                onClick={() => handleDelete(rate.id)}
                                className="bg-red-600 text-white text-xs px-3 py-1 rounded-md shadow hover:bg-red-500 flex items-center gap-1"
                            >
                                <Trash2 size="14" /> Delete
                            </button>
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 text-sm py-6">
                            No service rates available.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between mt-2 mb-4">
                <button 
                    type="button" 
                    onClick={() => setWagesModal(false)}
                    className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg flex items-center gap-1
                            hover:bg-white hover:text-gray-800 hover:border hover:border-gray-800 transition"
                >
                    <X size={18} />
                    Close
                </button>
            </div>

            <EmployeeWageByServiceForm
                formModal={formModal}
                setFormModal={setFormModal}
                form={form} 
                setForm={setForm}
                fetchEmployees={fetchEmployees}
                fetchServiceRates={fetchServiceRates}
            />

        </div>
    );
};

export default EmployeeWageByService;