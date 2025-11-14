import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import toastr from "toastr";
import 'toastr/build/toastr.min.css';
import { Edit, PlusSquare, Save, Trash, X } from "lucide-react";
import PayrollViewOtherEarnedForm from "./PayrollViewOtherEarnedForm";

const PayrollViewEmployeeEdit = ({ employee, search, year, setSearch, setYear, setPayroll, closeViewEmployeeModal }) => {

    const [formOtherEarnedModal, setFormOtherEarnedModal] = useState(false);
    const [formOtherEarned, setFormOtherEarned] = useState({
        id: "",
        payroll_employee_id: "",
        payroll_id: "",
        employee_id: "",
        earning_type_id: "",
        type: "",
        amount: "",
        total: "",
    });

    const [formData, setFormData] = useState({
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

    useEffect(() => {
        const salary = parseFloat(formData.salary) || 0;
        const no_of_day_present = parseInt(formData.no_of_day_present, 10) || 0;
        const days = parseInt(formData.days, 10) || 0;
        const hour = parseInt(formData.hour, 10) || 0;
        const minute = parseInt(formData.minute, 10) || 0;
        const ot_hour = parseInt(formData.ot_hour, 10) || 0;
        const ot_minute = parseInt(formData.ot_minute, 10) || 0;
        const salary_hr = Math.round((parseFloat(salary / 8) || 0) * 100) / 100;
        const salary_min = Math.round((parseFloat(salary_hr / 60) || 0) * 100) / 100;
        
        const basic_pay = Math.round(parseFloat((salary * days) + (salary_hr * hour) + (salary_min * minute)) * 100) / 100;
        const overtime = Math.round(parseFloat((salary_hr * ot_hour) + (salary_min * ot_minute)) * 100) / 100;
        
        let updatedOtherEarned = [];
        let total_other_earned = 0;

        // Check if there is data in other_earned and calculate accordingly
        if (formData.other_earned && formData.other_earned.length > 0) {
            // Update 'other_earned' based on 'no_of_day_present' and earning type
            updatedOtherEarned = formData.other_earned.map((earnedItem) => {
                // If the earning type is 'daily', multiply amount by 'no_of_day_present'
                if (earnedItem.earning_type?.type === 'daily') {
                    const per_day = earnedItem.amount;
                    const per_hour = Math.round((per_day / 8) * 100) / 100;
                    const per_minute = Math.round((per_hour / 60) * 100) / 100;

                    const earned_day = Math.round((per_day * days) * 100) / 100;
                    const earned_hour = Math.round((per_hour * hour) * 100) / 100;
                    const earned_minute = Math.round((per_minute * minute) * 100) / 100;

                    const earned_ot_hour = Math.round((per_hour * ot_hour) * 100) / 100;
                    const earned_ot_minute = Math.round((per_minute * ot_minute) * 100) / 100;

                    const total = Math.round((earned_day + earned_hour + earned_minute + earned_ot_hour + earned_ot_minute) * 100) / 100;

                    return {
                        ...earnedItem,
                        total: total
                    };
                }

                return earnedItem; // If not 'daily', keep the item unchanged
            });

            // Calculate the total from the updated 'other_earned' items
            total_other_earned = updatedOtherEarned.reduce((sum, earnedItem) => {
                return sum + (parseFloat(earnedItem.total) || 0); // Sum all 'total' fields
            }, 0);
        }

        const earned = basic_pay + overtime + total_other_earned;
        const netpay = earned - (parseFloat(employee.deduction) || 0);

        setFormData((prevData) => ({
            ...prevData,
            basic_pay: basic_pay,
            overtime: overtime,
            earned: earned,
            netpay: netpay,
            other_earned: updatedOtherEarned,
        }));

    }, [
        formData.salary, 
        formData.no_of_day_present,
        formData.days,
        formData.hour,
        formData.minute,
        formData.ot_hour,
        formData.ot_minute,
        employee.deduction,
    ]);
    
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

    const handleOtherEarnedNew = (employee) => {
        setFormOtherEarnedModal(true);
        setFormOtherEarned({
            id: "",
            payroll_employee_id: employee.id,
            payroll_id: employee.payroll_id,
            employee_id: employee.employee_id,
            earning_type_id: "",
            type: "",
            amount: "",
            total: "",
            no_of_day_present: formData.no_of_day_present,
        });
    };

    const handleOtherEarnedEdit = (employee) => {
        setFormOtherEarnedModal(true);
        setFormOtherEarned({
            id: employee.id,
            payroll_employee_id: employee.payroll_employee_id,
            payroll_id: employee.payroll_id,
            employee_id: employee.employee_id,
            earning_type_id: employee.earning_type_id,
            type: employee.type,
            amount: employee.amount,
            total: employee.total,
            no_of_day_present: formData.no_of_day_present,
        });
    };

    const handleOtherEarnedDelete = async (id) => {
        Swal.fire({
            title: "Delete this earnings?",
            text: "This action cannot be undone",
            icon: "warning",
            showCancelButton: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                const authToken = localStorage.getItem("token");
                
                const response = await axios.delete(`/api/payroll-other-earnings/${id}`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
                toastr.success("Employee Other Earnings deleted!");
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
            }
        });
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
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="grid grid-cols-2 gap-2">
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
                                <div>
                                    <label htmlFor="hour">Hour</label>
                                    <input 
                                        type="number"
                                        id="hour"
                                        name="hour"
                                        value={formData.hour}
                                        onChange={handleChange}
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="minute">Minute</label>
                                    <input 
                                        type="number"
                                        id="minute"
                                        name="minute"
                                        value={formData.minute}
                                        onChange={handleChange}
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label htmlFor="basic_pay">Basic Pay:</label>
                                    <input 
                                        type="number"
                                        id="basic_pay"
                                        name="basic_pay"
                                        value={formData.basic_pay}
                                        onChange={handleChange}
                                        className="border px-3 py-2 rounded-lg w-full"
                                        disabled
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label htmlFor="otAmount">OT Pay</label>
                                    <input 
                                        type="number"
                                        id="otAmount"
                                        name="otAmount"
                                        value={formData.salary / 8}
                                        onChange={handleChange}
                                        className="border px-3 py-2 rounded-lg w-full"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label htmlFor="ot_hour">OT Hour</label>
                                    <input 
                                        type="number"
                                        id="ot_hour"
                                        name="ot_hour"
                                        value={formData.ot_hour}
                                        onChange={handleChange}
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />  
                                </div>
                                <div>
                                    <label htmlFor="ot_minute">OT Minute</label>
                                    <input 
                                        type="number"
                                        id="ot_minute"
                                        name="ot_minute"
                                        value={formData.ot_minute}
                                        onChange={handleChange}
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label htmlFor="overtime">Overtime:</label>
                                    <input 
                                        type="number"
                                        id="overtime"
                                        name="overtime"
                                        value={formData.overtime}
                                        onChange={handleChange}
                                        className="border px-3 py-2 rounded-lg w-full"
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 mb-2">
                            <div>
                                <label htmlFor="no_of_day_present">Present Days</label>
                                <input 
                                    type="number"
                                    id="no_of_day_present"
                                    name="no_of_day_present"
                                    value={formData.no_of_day_present}
                                    onChange={handleChange}
                                    className="border px-3 py-2 rounded-lg w-full"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-2">                            
                            <div className="flex justify-left">
                                <h5 className="text-sm font-medium text-gray-700">Other Earnings:</h5>
                                <button
                                    type="button"
                                    className="text-blue-500 py-1 px-3 rounded-lg text-sm hover:text-blue-600 transition-colors"
                                    onClick={() => handleOtherEarnedNew(formData)} 
                                >
                                    <PlusSquare size={16} />
                                </button>
                            </div>
                        </div>

                        {formData.other_earned?.length > 0 &&
                            formData.other_earned.map((earning) => (
                                <div className="flex justify-between items-center gap-4">
                                    <div>
                                        <p className="text-md text-purple-800">{earning.earning_type?.name}:</p>
                                    </div>
                                    <div className="text-right flex justify-between items-center gap-4">
                                        <p className="text-md text-purple-800">₱{earning.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        <div className="flex items-center">
                                            <button
                                                type="button"
                                                className="text-yellow-500 py-1 px-3 rounded-lg text-sm hover:text-blue-600 transition-colors"
                                                onClick={() => handleOtherEarnedEdit(earning)} 
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="text-red-500 py-1 px-3 rounded-lg text-sm hover:text-blue-600 transition-colors"
                                                onClick={() => handleOtherEarnedDelete(earning.id)} 
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }

                        <div className="flex justify-between mt-4">
                            <div>
                                <p className="text-md text-blue-800">Earned:</p>
                                <p className="text-md text-red-800">Deductions:</p>
                                <p className="text-md text-green-800">Netpay:</p>
                            </div>
                            <div className="text-right">
                                <p className="text-md text-blue-800">
                                    ₱{formData.earned?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-md text-red-800">
                                    ₱{employee.deduction?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-md text-green-800">
                                    ₱{formData.netpay?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
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
            
            <PayrollViewOtherEarnedForm
                formModal={formOtherEarnedModal}
                setFormModal={setFormOtherEarnedModal}
                form={formOtherEarned} 
                setForm={setFormOtherEarned}
                setFormData={setFormData}
                setPayroll={setPayroll}
            />

        </div>
    );
};

export default PayrollViewEmployeeEdit;
