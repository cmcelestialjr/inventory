import React, { useState, useEffect } from "react";
import axios from "axios";
import toastr from "toastr";
import 'toastr/build/toastr.min.css';
import { Save, X } from "lucide-react";

const PayrollViewEmployeeEdit = ({ employee, search, year, setSearch, setYear, setPayroll, closeViewEmployeeModal }) => {

    const [formData, setFormData] = useState({
        id: employee.id,
        salary: employee.salary,
        days: employee.no_of_day_present,
        earned: employee.earned,
        netpay: employee.netpay,
    });

    useEffect(() => {
        const salary = parseFloat(formData.salary) || 0;
        const days = parseFloat(formData.days, 10) || 0;

        const earned = salary * days;
        const netpay = earned - (employee.deduction || 0);

        setFormData((prevData) => ({
            ...prevData,
            earned: earned,
            netpay: netpay,
        }));
    }, [formData.salary, formData.days, employee.deduction]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {

            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/payroll/updateEarned`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                setSearch(search);
                setYear(year);
                setPayroll(response.data.data);
            }else{
                toastr.error("Error! There is something wrong in updating data.");
            }

        } catch (err) {
            toastr.error("Error saving data");
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-60">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit</h2>
                    <button
                        className="text-red-500 font-semibold"
                        onClick={closeViewEmployeeModal}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mt-3 gap-2">
                        <div>
                            <label htmlFor="salary">Salary</label>
                            <input 
                                type="number"
                                id="salary"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="days">Days</label>
                            <input 
                                type="number"
                                id="days"
                                name="days"
                                value={formData.days}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                        <div className="flex justify-between mt-6">
                            <div>
                                <p className="text-md text-blue-800">Earned:</p>
                                <p className="text-md text-red-800">Deductions:</p>
                                <p className="text-md text-green-800">Netpay:</p>
                            </div>
                            <div className="text-right">
                                <p className="text-md text-blue-800">{formData.earned}</p>
                                <p className="text-md text-red-800">{employee.deduction}</p>
                                <p className="text-md text-green-800">{formData.netpay}</p>
                            </div>
                        </div>
                        <div className="flex justify-between mb-2 mt-6">
                            <button 
                                type="button" 
                                onClick={closeViewEmployeeModal}
                                className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg flex items-center gap-1
                                    hover:bg-white hover:text-gray-800 hover:border hover:border-gray-800 transition"
                            >
                                <X size={18} />
                                Close
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
                        
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PayrollViewEmployeeEdit;
