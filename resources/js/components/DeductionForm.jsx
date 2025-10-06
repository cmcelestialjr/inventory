import React, { useState, useEffect } from "react";
import axios from "axios";
import { Save, X } from "lucide-react";
import toastr from 'toastr';

const DeductionForm = ({ formModal, closeModal, form, setForm, fetchDeductions }) => {
    if (!formModal) return null;

    const [title, setTitle] = useState("Edit");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (form.id === "") {
            setTitle("New");
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!form.name.trim()) newErrors.name = true;
        if (!form.type.trim()) newErrors.firstname = true;

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toastr.error("Please fill in all required fields.");
            return;
        }

        try {
            const authToken = localStorage.getItem("token");

            const formData = new FormData();
            for (const key in form) {
                const value = form[key];
                formData.append(key, value);
            }
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    // "Content-Type": "multipart/form-data",
                },
            };

            if (form.id) {
                formData.append('_method', 'PUT'); 
                await axios.post(`/api/deductions/${form.id}`, formData, config);
                toastr.success("Deduction updated!");
            } else {
                await axios.post("/api/deductions", formData, config);
                toastr.success("Deduction added!");
            }
            setForm({
                id: "",
                name: "",
                group: "",
                type: "amount",
                amount: 0,
                percentage: 0,
                ceiling: 0,
            });
            fetchDeductions();
            closeModal();
        } catch (err) {
            toastr.error("Error saving data");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prevForm => ({
            ...prevForm,
            [name]: value
        }));
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">{title} Deduction</h2>
                    <button
                        onClick={closeModal}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mt-3 grid grid-cols-2 gap-2">                        
                        <div>
                            <label htmlFor="name">
                                Name <span className="text-red-600">*</span>
                            </label>
                            <input 
                                type="text"
                                id="name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.name ? 'border-red-600' : ''}`}
                            />
                        </div>
                        <div>
                            <label htmlFor="group">Group</label>
                            <input 
                                type="text"
                                id="group"
                                name="group"
                                value={form.group}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="type">
                                Type <span className="text-red-600">*</span>
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.type ? "border-red-600" : ""}`}
                            >
                                <option value="amount">Amount</option>
                                <option value="percentage">Percentage</option>
                            </select>
                        </div>

                        {form.type === "amount" ? (

                        <div>
                            <label htmlFor="amount">Amount</label>
                            <input 
                                type="number"
                                id="amount"
                                name="amount"
                                value={form.amount}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        ) : (
                            <>
                            <div>
                                <label htmlFor="percentage">Percentage %</label>
                                <input 
                                    type="number"
                                    id="percentage"
                                    name="percentage"
                                    value={form.percentage}
                                    onChange={handleChange}
                                    className="border px-3 py-2 rounded-lg w-full"
                                />
                            </div>
                            <div>
                                <label htmlFor="amount">Ceiling</label>
                                <input 
                                    type="number"
                                    id="ceiling"
                                    name="ceiling"
                                    value={form.ceiling}
                                    onChange={handleChange}
                                    className="border px-3 py-2 rounded-lg w-full"
                                />
                            </div>
                            </>
                        )}
                    </div>
                    <div className="flex justify-between mt-2">
                        <button 
                            type="button" 
                            onClick={closeModal}
                            className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg flex items-center gap-1
                                hover:bg-white hover:text-gray-800 hover:border hover:border-gray-800 transition"
                        >
                            <X size={18} />
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-1
                                hover:bg-white hover:text-blue-600 hover:border hover:border-blue-600 transition"
                        >
                            <Save size={18} />
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeductionForm;