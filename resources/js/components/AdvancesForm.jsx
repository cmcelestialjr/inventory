import React, { useState, useEffect } from "react";
import axios from "axios";
import { Save, X } from "lucide-react";
import toastr from 'toastr';
import EmployeeSearch from "./EmployeeSearch";

const AdvancesForm = ({ formModal, closeModal, form, setForm, fetchAdvances }) => {
    if (!form || !formModal) return null;

    const [title, setTitle] = useState("Edit");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (form.id === "") {
            setTitle("New");
        }
    }, []);

    useEffect(() => {
        const amount = parseFloat(form.advance_amount);
        const periods = parseInt(form.repayment_periods);

        if (amount > 0 && periods > 0) {
            const deduction = (amount / periods).toFixed(2);

            if (errors.monthly_deduction && parseFloat(deduction) > 0) {
                setErrors(prevErrors => {
                    const newErrors = { ...prevErrors };
                    delete newErrors.monthly_deduction;
                    return newErrors;
                });
            }
            
            if (parseFloat(form.monthly_deduction) !== parseFloat(deduction)) {
                setForm(prevForm => ({
                    ...prevForm,
                    monthly_deduction: deduction,
                }));
            }
        } else if (parseFloat(form.monthly_deduction) !== 0) {
            setForm(prevForm => ({
                ...prevForm,
                monthly_deduction: 0,
            }));
        }
    }, [form.advance_amount, form.repayment_periods, setForm]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        const updatedValue = ['advance_amount', 'repayment_periods', 'monthly_deduction'].includes(name) 
            ? parseFloat(value) || 0
            : value;

        setForm(prevForm => ({
            ...prevForm,
            [name]: updatedValue
        }));

        if (name === 'advance_amount' || name === 'repayment_periods') {
            const isValid = updatedValue > 0;
            
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                
                if (isValid) {
                    delete newErrors[name];
                } else if (updatedValue <= 0) {
                    newErrors[name] = true;
                }
                
                return newErrors;
            });
        }
    };

    const handleEmployeeSelect = (employee) => {

        if (errors.employee_id) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors.employee_id;
                return newErrors;
            });
        }

        setForm(prevData => ({
            ...prevData,
            employee_id: employee.id,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!form.employee_id) newErrors.employee_id = true;
        if (!form.advance_amount || form.advance_amount <= 0) newErrors.advance_amount = true;
        if (!form.repayment_periods || form.repayment_periods <= 0) newErrors.repayment_periods = true;
        if (!form.monthly_deduction || form.monthly_deduction <= 0) newErrors.monthly_deduction = true;

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
                await axios.post(`/api/advances/${form.id}`, formData, config);
                toastr.success("Advance updated!");
            } else {
                await axios.post("/api/advances", formData, config);
                toastr.success("Advance added!");
            }
            setForm({
                id: "",
                employee_id: "",
                advance_amount: 0,
                repayment_periods: 1,
                monthly_deduction: 0,
                status_id: 1,
            });
            fetchAdvances();
            closeModal();
        } catch (err) {
            toastr.error("Error saving data");
        }
    };    

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">{title} Cash Advance</h2>
                    <button
                        onClick={closeModal}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="hidden" 
                        name="employee_id" 
                        value={form.employee_id || ''} 
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2">                        
                        {!form.id && (
                            <>
                            <div>
                                
                                <label htmlFor="employee" className="block text-sm font-medium text-gray-700"> 
                                    Employee <span className="text-red-600">*</span> 
                                </label>
                                <div className={`w-full ${errors.employee_id ? "border px-3 py-2 rounded-lg border-red-600" : ""}`}>
                                    <EmployeeSearch 
                                        onEmployeeSelect={handleEmployeeSelect}
                                        employeeID={form.employee_id}
                                    />
                                </div>
                            </div>
                        </>
                        )}
                        <div>
                            <label htmlFor="advance_amount">Advance Amount</label>
                            <input 
                                type="number"
                                id="advance_amount"
                                name="advance_amount"
                                value={form.advance_amount}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.advance_amount ? "border-red-600" : ""}`}
                            />
                        </div>
                        <div>
                            <label htmlFor="repayment_periods">
                                Repayment Period <span className="text-red-600">*</span>
                            </label>
                            <input 
                                type="number"
                                id="repayment_periods"
                                name="repayment_periods"
                                value={form.repayment_periods}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.repayment_periods ? "border-red-600" : ""}`}
                            />
                        </div>
                        <div>
                            <label htmlFor="monthly_deduction">Salary Deduction</label>
                            <input 
                                type="number"
                                id="monthly_deduction"
                                name="monthly_deduction"
                                value={form.monthly_deduction}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.monthly_deduction ? "border-red-600" : ""}`}
                            />
                        </div>
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

export default AdvancesForm;