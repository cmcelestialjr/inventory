import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit, Plus, Save, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";
import toastr from 'toastr';
import EmployeeWageByOthersForm from "./EmployeeWageByOthersForm";

const EmployeeWageByOthers = ({ activeTab, wages, fetchEmployees, setWagesModal }) => {
    if (activeTab!='Other Earnings') return null;

    const authToken = localStorage.getItem("token");
    const [otherEarnings, setOtherEarnings] = useState([]);    
    const [formModal, setFormModal] = useState(false);
    const [form, setForm] = useState({
        id: "",
        employee_id: "",
        earning_type_id: "",
        amount: 0.00
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
        fetchOtherEarnings();
    }, []);

    const fetchOtherEarnings = async () => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(
                `/api/employee-other-earnings`, { 
                params: {
                    id: wages.id
                }, 
                headers: { Authorization: `Bearer ${authToken}` } }
            );

            setOtherEarnings(response.data.data);

        } catch (error) {
            
        }
    };

    const handleForm = (employee) => {
        setFormModal(true);
        setForm(employee);
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete this earnings?",
            text: "This action cannot be undone",
            icon: "warning",
            showCancelButton: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                await axios.delete(`/api/employee-other-earnings/${id}`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
                toastr.success("Employee Other Earnings deleted!");
                setOtherEarnings(prevRates => prevRates.filter(rate => rate.id !== id));
                fetchEmployees();
                setForm({
                    id: "",
                    employee_id: "",
                    earning_type_id: "",
                    amount: 0.00
                });
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
                    <Plus size={18} /> New Earning
                </button>
            </div>

            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto relative w-full">
                {/* Desktop Table View */}
                <table className="hidden md:table w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Earning Type</th>
                            <th className="border p-2">Amount</th>
                            <th className="border p-2">Type</th>
                            <th className="border p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {otherEarnings.length > 0 ? (
                            otherEarnings.map((earning) => (
                                <tr key={earning.id}>
                                    <td className="border p-2 text-center">{earning.type?.name}</td>
                                    <td className="border p-2 text-right">{formatPeso(earning.amount)}</td>
                                    <td className="border p-2 text-center">{earning.type?.type}</td>
                                    <td className="border p-2">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleForm(earning)}
                                                className="bg-yellow-500 text-white px-3 py-2 rounded-md shadow hover:bg-yellow-400 flex items-center gap-1"
                                            >
                                                <Edit size="14" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(earning.id)}
                                                className="bg-red-600 text-white px-3 py-2 rounded-md shadow hover:bg-red-500 flex items-center gap-1"
                                            >
                                                <Trash2 size="14" /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                            ) : (
                            <tr>
                                <td className="border p-2 text-center" colSpan={3}>
                                    No Other Earnings available.
                                </td>                                
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {otherEarnings.length > 0 ? (
                        otherEarnings.map((earning) => (
                        <div key={earning.id} className="border rounded-lg p-3 shadow-sm bg-white">
                            <div className="mt-2 text-sm">
                                <p><strong>Earning Type:</strong> {earning.type?.name}</p>
                                <p><strong>Amount:</strong> {formatPeso(earning.amount)}</p>
                                <p><strong>Type:</strong> {earning.type?.type}</p>
                            </div>

                            <div className="flex justify-end gap-2 mt-3">
                            <button
                                onClick={() => handleForm(earning)}
                                className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-md shadow hover:bg-yellow-400 flex items-center gap-1"
                            >
                                <Edit size="14" /> Edit
                            </button>
                            <button
                                onClick={() => handleDelete(earning.id)}
                                className="bg-red-600 text-white text-xs px-3 py-1 rounded-md shadow hover:bg-red-500 flex items-center gap-1"
                            >
                                <Trash2 size="14" /> Delete
                            </button>
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 text-sm py-6">
                            No Other Earnings available.
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

            <EmployeeWageByOthersForm
                formModal={formModal}
                setFormModal={setFormModal}
                form={form} 
                setForm={setForm}
                fetchEmployees={fetchEmployees}
                fetchOtherEarnings={fetchOtherEarnings}
            />

        </div>
    );
};

export default EmployeeWageByOthers;