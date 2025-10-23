import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Save, X } from "lucide-react";
import toastr from 'toastr';
import EarningTypesForm from "./EarningTypesForm";

const PayrollViewOtherEarnedForm = ({ formModal, setFormModal, form, setForm, setFormData, setPayroll }) => {
    if (!formModal) return null;

    const [title, setTitle] = useState("Edit");
    const [errors, setErrors] = useState({});
    const [earningTypes, setEarningTypes] = useState({});
    const [formEtModal, setFormEtModal] = useState(false);
    const [formEt, setFormEt] = useState({
        id: "",
        name: "",
        type: "",
    });

    useEffect(() => {
        fetchEarningTypes();
    }, []);

    useEffect(() => {
        if (form.id === "") {
            setTitle("New");
        }
    }, []);

    useEffect(() => {
        setForm((prevData) => ({
            ...prevData,
            total: parseFloat(form.amount || 0) * parseFloat(form.no_of_day_present || 0),
        }));
    }, [form.amount]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!form.earning_type_id) newErrors.earning_type_id = true;
        if (!form.amount || parseFloat(form.amount) <= 0) {
            newErrors.amount = "Amount must be greater than 0";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toastr.error("Please fill in all required fields.");
            return;
        }

        try {
            const authToken = localStorage.getItem("token");
            
            const formData1 = form;
            
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            };

            let response = [];

            if (form.id) {
                response = await axios.put(`/api/payroll-other-earnings/${form.id}`, formData1, config);
                toastr.success("Employee Other Earnings updated!");
            } else {
                response = await axios.post("/api/payroll-other-earnings", formData1, config);
                toastr.success("Employee Other Earnings added!");

                setForm({
                    id: "",
                    payroll_employee_id: "",
                    payroll_id: "",
                    employee_id: "",
                    earning_type_id: "",
                    type: "",
                    amount: "",
                    total: "",
                });
            }
            
            if(response){
                const employee = response.data.data;
                setFormData({
                    id: employee.id,
                    payroll_id: employee.payroll_id,
                    employee_id: employee.employee_id,
                    salary: employee.salary,
                    no_of_day_present: employee.no_of_day_present,
                    days: employee.day,
                    hour: employee.hour,
                    minute: employee.minute,
                    ot_hour: employee.ot_hour,
                    ot_minute: employee.ot_minute,
                    basic_pay: employee.basic_pay,
                    overtime: employee.overtime,
                    earned: employee.earned,
                    netpay: employee.netpay,
                    other_earned: employee.other_earned
                });
                setPayroll(response.data.payroll);
                setFormModal(false);
            }else{
                toastr.error("Error!");
            }
        } catch (err) {
            toastr.error("Error saving data"+err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prevForm => ({
            ...prevForm,
            [name]: value
        }));
    };

    const handleSelected = (selected) => {
        
        setForm((prev) => ({
            ...prev,
            earning_type_id: selected.id,
            type: selected.type
        }));
        
    };

    const handleFormEt = (formEt) => {
        setFormEtModal(true);
        setFormEt(formEt);
    };

    const fetchEarningTypes = async () => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get("/api/earning-types/fetch", {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setEarningTypes(response.data);
        } catch (error) {
            // console.error("Error fetching products:", error);
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-70">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">{title} Employee Other Earning</h2>
                    <button
                        onClick={() => setFormModal(false)}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mt-3 grid grid-cols-1 gap-2">
                        <div>
                            <label htmlFor="earning_type_id" className="flex items-center gap-1">
                                Earning Type<span className="text-red-600">*</span>
                                {' '}
                                <button 
                                    type="button" 
                                    onClick={() => handleFormEt(formEt)}
                                    className="text-md text-blue-800 flex items-center gap-1 hover:text-blue-500"
                                >
                                    <Plus size={14} />
                                </button>
                            </label>

                            <select
                                id="earning_type_id"
                                value={form.earning_type_id || ''}
                                onChange={(e) => {
                                    const selected = Array.isArray(earningTypes)
                                    ? earningTypes.find((et) => et.id === parseInt(e.target.value))
                                    : null;
                                    if (selected) handleSelected(selected);
                                }}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.earning_type_id ? "border-red-600" : ""}`}
                            >
                                <option value="">
                                    Select Earning Type...
                                </option>

                                {Array.isArray(earningTypes) &&
                                    earningTypes.length > 0 &&
                                    earningTypes.map((earningType) => (
                                    <option key={earningType.id} value={earningType.id}>
                                        {earningType.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <label htmlFor="amount">
                                Amount<span className="text-red-600">*</span>
                            </label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={form.amount}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.amount ? "border-red-600" : ""}`}
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="total">
                                Total
                            </label>
                            <input
                                type="number"
                                id="total"
                                name="total"
                                value={form.total}
                                className="border px-3 py-2 rounded-lg w-full"
                                disabled
                            />
                        </div>
                    </div>
                    <div className="flex justify-between mt-2">
                        <button 
                            type="button" 
                            onClick={() => setFormModal(false)}
                            className="px-3 py-2 bg-gray-200 text-md text-gray-800 rounded-lg flex items-center gap-1
                                hover:bg-white hover:text-gray-800 hover:border hover:border-gray-800 transition"
                        >
                            <X size={14} />
                            Cancel
                        </button>
                        <button
                            type="submit" 
                            className="px-3 py-2 bg-blue-600 text-md text-white rounded-lg flex items-center gap-1
                                hover:bg-white hover:text-blue-600 hover:border hover:border-blue-600 transition"
                        >
                            <Save size={14} />
                            Save
                        </button>
                    </div>
                </form>
            </div>

            <EarningTypesForm
                formEtModal={formEtModal}
                setFormEtModal={setFormEtModal}
                formEt={formEt} 
                setFormEt={setFormEt}
                fetchEarningTypes={fetchEarningTypes}
            />
        </div>
    );
};

export default PayrollViewOtherEarnedForm;