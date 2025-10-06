import React, { useState, useEffect } from "react";
import axios from "axios";
import toastr from "toastr";
import 'toastr/build/toastr.min.css';
import { Save, X } from "lucide-react";

const PayrollViewDeductionEdit = ({ deduction, option, search, year, setSearch, setYear, setPayroll, closeEditDeductionModal }) => {


    const [formData, setFormData] = useState({
        id: deduction.id,
        option: option,
        amount: option === 'deduction' ? deduction.amount : deduction.lates_absences,
    });
    
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let errorCount = 0;

        if (formData.amount <= 0) {
            toastr.error("Error!", "Amount should be greater than 0.");
            errorCount++;
        }

        if(errorCount>0){
            return;
        }
        
        try {

            const token = localStorage.getItem("token");
            
            const response = await axios.put(`/api/payrollDeduction/${formData.id}`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);                
                setSearch(search);
                setYear(year);
                setPayroll(response.data.data);
                closeEditDeductionModal();
            }else{
                toastr.error("Error! There is something wrong in updating deduction.");
            }

        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'An unexpected error occurred.';
            toastr.error(message);
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-60">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit Deduction</h2>
                    <button
                        className="text-red-500 font-semibold"
                        onClick={closeEditDeductionModal}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mt-3 gap-2">
                        <div>
                            {option=="deduction" && (
                                <div className="mt-2 text-gray-700">
                                    <h4>{deduction.deduction?.name} {deduction.deduction?.group}</h4>
                                </div>
                            )}

                            {option=="lates" && (
                                <div className="mt-2 mb-2 text-gray-700">
                                    <h4>Lates</h4>
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="amount">Amount</label>
                            <input 
                                type="number"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                        <div className="flex justify-between mb-2 mt-6">
                            <button
                                type="button"
                                onClick={closeEditDeductionModal}
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

export default PayrollViewDeductionEdit;
