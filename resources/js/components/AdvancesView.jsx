import React, { useState, useEffect, useMemo } from "react";
import { Save, X } from "lucide-react";

const AdvancesView = ({ viewModal, selectedAdvance, closeViewModal }) => {
    if (!viewModal) return null;

    const textColors = [
        "text-blue-500",
        "text-yellow-800",
        "text-green-800",
        "text-red-800",
    ];

    const textColor = textColors[(selectedAdvance.status?.id - 1) % textColors.length];
    

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        } catch (e) {
            console.error("Invalid date string:", dateString, e);
            return 'Invalid Date';
        }
    };

    const processedDeductions = useMemo(() => {
        return selectedAdvance.deductions?.map(item => {
        const isPaid = !!item.deduction_date;
        const formattedDate = formatDate(item.deduction_date);

        // Determine status style and label
        let statusLabel;
        let statusClass;

        if (isPaid) {
            statusLabel = 'Paid';
            statusClass = 'bg-green-100 text-green-800';
        } else {
            statusLabel = 'Unpaid';
            statusClass = 'bg-amber-100 text-amber-800';
        }

        return {
            ...item,
            isPaid,
            formattedDate,
            statusLabel,
            statusClass,
        };
        }).sort((a, b) => {
            // Sort by status (Unpaid first) then by ID
            if (a.isPaid !== b.isPaid) {
            return a.isPaid ? 1 : -1; // Unpaid (false) comes before Paid (true)
            }
            return String(a.id).localeCompare(String(b.id));
        });
    }, [selectedAdvance]);

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">{selectedAdvance.code}</h2>
                    <button
                        onClick={closeViewModal}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-col w-full">
                    <div className="flex justify-between items-start">
                        <div className="w-full">
                            <p className="text-sm text-gray-700 flex justify-between w-full">
                                Name:
                                <span className="font-medium text-gray-800">
                                    {selectedAdvance.employee?.lastname}, {selectedAdvance.employee?.firstname} {selectedAdvance.employee?.extname} 
                                    {selectedAdvance.employee?.middlename && (
                                        <span className="ml-1">
                                            {selectedAdvance.employee.middlename.charAt(0)}.
                                        </span>
                                    )}
                                </span>
                            </p>
                            <p className="text-sm text-gray-700 flex justify-between w-full">
                                Advance amount: <span className="font-medium">
                                    {selectedAdvance.advance_amount > 0 ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(selectedAdvance.advance_amount) : 0}
                                </span>
                            </p>
                            <p className="text-sm text-gray-700 flex justify-between w-full">
                                Repayment Period/s: <span className="font-medium">
                                    {selectedAdvance.repayment_periods}
                                </span>
                            </p>
                            <p className="text-sm text-gray-700 flex justify-between w-full">
                                Monthly Deduction: <span className="font-medium">
                                    {selectedAdvance.monthly_deduction > 0 ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(selectedAdvance.monthly_deduction) : 0}
                                </span>
                            </p>
                            <p className="text-sm text-gray-700 flex justify-between w-full">
                                Remaining: <span className="font-medium">
                                    {selectedAdvance.advance_amount - selectedAdvance.total_deducted > 0 ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(selectedAdvance.advance_amount - selectedAdvance.total_deducted) : 0}
                                </span>
                            </p>
                            <p className="text-sm text-gray-700 flex justify-between w-full">
                                Status: <span className={`font-medium ${textColor}`}>{selectedAdvance.status?.name}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-2 space-y-4">
                    {processedDeductions.map((item) => (
                    <div key={item.id} className="bg-white shadow-lg rounded-xl p-4 border border-gray-100">
                        <div className="flex justify-between items-start mb-2 border-b pb-2">
                            <div className="flex flex-col">
                                <p className="text-md font-bold text-gray-900 leading-tight">
                                    {item.deduction_amount > 0 ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(item.deduction_amount) : 0}
                                </p>
                            </div>
                            <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.statusClass}`}
                            >
                                {item.statusLabel}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-1 text-sm">
                            <p className="text-gray-500">Deducted On:</p>
                            <p className={`font-medium text-right ${item.isPaid ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                                {item.formattedDate || 'Not yet deducted'}
                            </p>
                        </div>
                    </div>
                    ))}
                </div>

                <div className="flex justify-end mt-2">
                    <button 
                        type="button" 
                        onClick={closeViewModal}
                        className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg flex items-center gap-1
                            hover:bg-white hover:text-gray-800 hover:border hover:border-gray-800 transition"
                    >
                        <X size={18} />
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvancesView;