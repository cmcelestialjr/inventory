import React, { useState, useEffect } from "react";
import axios from "axios";
import toastr from "toastr";
import 'toastr/build/toastr.min.css';
import { Save, X } from "lucide-react";

const PayrollViewDeductionAdd = ({ employee, search, year, setSearch, setYear, setPayroll, closeAddDeductionModal }) => {

    const [deductions, setDeductions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredDeductions, setFilteredDeductions] = useState([]);

    useEffect(() => {
        fetchDeductions();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = deductions.filter(deduction =>
                deduction.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredDeductions(filtered);
        } else {
            setFilteredDeductions(deductions);
        }
    }, [searchQuery, deductions]);

    const fetchDeductions = async () => {
        try {    
            const authToken = localStorage.getItem("token");        
            const response = await axios.get(`/api/payrollDeduction`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setDeductions(response.data.data);
            setFilteredDeductions(response.data.data);
        } catch (error) {

        }
    };

    const [formData, setFormData] = useState({
        id: employee.id,
        netpay: employee.netpay,
        deduction_id: null,
        deduction_name: '',
        amount: 0.0,
    });

    const handleDeductionSelect = (deduction) => {
        setFormData((prevData) => ({
            ...prevData,
            deduction_id: deduction.id,
            deduction_name: deduction.name+' '+deduction.group,
        }));
    };
    
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

        if (!formData.deduction_id) {
            toastr.error("Error!", "Please select a deduction.");
            errorCount++;
        }

        if (formData.amount <= 0) {
            toastr.error("Error!", "Amount should be greater than 0.");
            errorCount++;
        }

        if(errorCount>0){
            return;
        }
        
        try {

            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/payrollDeduction`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);                
                setSearch(search);
                setYear(year);
                setPayroll(response.data.data);
                closeAddDeductionModal();
            }else{
                toastr.error("Error! There is something wrong in adding deduction.");
            }

        } catch (err) {
            toastr.error("Error adding deduction");
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-60">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Add Deduction</h2>
                    <button
                        className="text-red-500 font-semibold"
                        onClick={closeAddDeductionModal}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mt-3 gap-2">
                        <div>
                            <input
                                type="text"
                                placeholder="Search Deductions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                            />

                            {formData.deduction_name && (
                                <div className="mt-2 text-gray-700">
                                    Selected Deduction: <strong>{formData.deduction_name}</strong>
                                </div>
                            )}

                            <div className="w-full mt-1 mb-1 bg-white rounded-md shadow-lg max-h-40 overflow-y-auto">
                                <ul className="divide-y divide-gray-200">
                                    {filteredDeductions.length > 0 ? (
                                        filteredDeductions.map((deduction) => (
                                            <li
                                                key={deduction.id}
                                                className="cursor-pointer px-4 py-2 hover:bg-gray-200"
                                                onClick={() => handleDeductionSelect(deduction)}
                                            >
                                                <span>{deduction.name} {deduction.group}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-500">No deductions found</li>
                                    )}
                                </ul>
                            </div>
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
                                onClick={closeAddDeductionModal}
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

export default PayrollViewDeductionAdd;
