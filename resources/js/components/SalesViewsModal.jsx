import React from "react";
import { X } from "lucide-react";
import moment from "moment";

const SalesViewsModal = ({ isOpen, onClose, sale }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">New Sale</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                    <p><strong>Code:</strong> {sale?.code}</p>
                    <p><strong>DateTime:</strong> {moment(sale?.date_time_of_sale).format("MMM D, YY h:mma")}</p>
                    <p><strong>Cashier:</strong> {sale?.cashier_name}</p>
                    <p><strong>Customer:</strong> {sale?.customer_name}</p>
                    <p className="text-blue-900"><strong>Total Cost:</strong> {sale?.total_cost}</p>
                    <p className="text-green-800"><strong>Total Amount:</strong> {sale?.total_amount}</p>
                </div>

                <div className="flex gap-4 mt-3">
                    {/* Product List Headers */}
                    <div className="mt-3 w-4/6">
                        <div className="hidden md:flex justify-between items-center p-2 border-b bg-gray-200 font-semibold">
                            <span className="w-2/12">Code</span>
                            <span className="w-2/12">Image</span>
                            <span className="w-2/12">Product</span>
                            <span className="w-1/12 text-right">Cost</span>
                            <span className="w-1/12 text-right">Price</span>
                            <span className="w-1/12 text-right">Disc</span>
                            <span className="w-1/12 text-right">Qty</span>
                            <span className="w-2/12 text-right">Amount</span>
                        </div>

                    <div className="border max-h-[15rem] overflow-y-auto p-2">
                        {sale?.products_list?.map((product, index) => (
                            <div
                                key={index}
                                className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 border-b text-sm"
                            >
                                {/* Mobile View */}
                                <div className="block md:hidden w-full mb-2">
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-gray-600">Code:</span>
                                    <span>{product.product_info?.code}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-gray-600">Product:</span>
                                    <span>{product.product_info?.name_variant}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-gray-600">Cost:</span>
                                    <span>{product.cost}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-gray-600">Price:</span>
                                    <span>{product.price}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-gray-600">Discount:</span>
                                    <span>{product.discount_amount}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-gray-600">Quantity:</span>
                                    <span>{product.qty}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600">Amount:</span>
                                    <span>{Number(product.amount).toFixed(2)}</span>
                                </div>
                            </div>

                                {/* Desktop View */}
                            <div className="hidden md:flex w-full justify-between items-center">
                                <span className="w-2/12">{product.product_info?.code}</span>
                                <span className="w-2/12 text-center">
                                    <img
                                    src={product.product_info?.img}
                                    alt={product.product_info?.name}
                                    className="w-16 h-16 object-cover rounded shadow"
                                    />
                                </span>
                                <span className="w-2/12">{product.product_info?.name_variant}</span>
                                <span className="w-1/12 text-right">{product.cost}</span>
                                <span className="w-1/12 text-right">{product.price}</span>
                                <span className="w-1/12 text-right">{product.discount_amount}</span>
                                <span className="w-1/12 text-right">{product.qty}</span>
                                <span className="w-2/12 text-right font-semibold">{Number(product.amount).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* Right Side - Payment Summary */}
                    <div className="mt-3 w-2/6">
                        <div className="border p-4 rounded-lg shadow-md bg-gray-100">
                            <h3 className="text-lg font-semibold mb-4 text-center">Payment Option:</h3>
                            {sale?.payment_options.map((paymentOption, index) => (
                                // <div key={index} className="flex justify-between mb-2 text-blue-800">
                                <div key={index} className={`flex justify-between mb-2 ${paymentOption.payment_option_info.font_color || ''}`}>
                                    <span className="font-semibold">
                                        {paymentOption.payment_option_name} : 
                                    </span>
                                    <span className="font-semibold">{Number(paymentOption.amount_paid).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">Close</button>
            </div>
        </div>
    );
};

export default SalesViewsModal;
