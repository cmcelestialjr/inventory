import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Layout from "./Layout";
import { Edit, Plus, X, } from "lucide-react";
import toastr from 'toastr';
import Swal from "sweetalert2";
import 'toastr/build/toastr.min.css';
import "react-datepicker/dist/react-datepicker.css";

const Damaged = () => {
    const [damaged, setDamaged] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedDamageStatus, setSelectedDamageStatus] = useState("all");
    const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
    const [damageId, setDamageId] = useState(null);
    const [damageName, setDamageName] = useState(null);
    const [status, setStatus] = useState(2);
    const [showDropdownProducts, setShowDropdownProducts] = useState(false);   
    const [productOptions, setProductOptions] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [searchProduct, setSearchProduct] = useState(null);
    const [priceOptions, setPriceOptions] = useState([]);
    const [selectedPrice, setSelectedPrice] = useState(null);
    const [quantity, setQuantity] = useState(null);
    const [amount, setAmount] = useState(0.00);
    const [productName, setProductName] = useState(null);
    const [productId, setProductId] = useState(null);
    const [cost, setCost] = useState(0.00);
    const [price, setPrice] = useState(0.00);
    const [remarks, setRemarks] = useState('');

    const didFetch = useRef(false);

    useEffect(() => {
        if (didFetch.current) return;
        didFetch.current = true;

        fetchStatusOptions();
    }, []);

    useEffect(() => {
        fetchDamaged(selectedDamageStatus);
    }, [search, page, selectedDamageStatus]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const fetchStatusOptions = async () => {
        try {
          const authToken = localStorage.getItem("token");
          const response = await axios.get("/api/damaged/fetch/statuses", {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          setStatusOptions(response.data);
        } catch (error) {
          // console.error("Error fetching summary:", error);
        }
    };

    const fetchDamaged = async (filter) => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/damaged`, {
                params: {
                    search: search,
                    page: page,
                    filter: filter
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setDamaged(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            // console.error("Error fetching damaged:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (quantity<=0) {
            toastr.error("Please input Qty!");
            return;
        }

        try {
            const formData = {
                damageId: damageId,
                productId: productId,
                qty: quantity,
                price: price,
                cost: cost,
                amount: amount,
                status: status,
                remarks: remarks
            };
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/damaged/manage`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                if(damageId==null){
                    setDamageId(null);
                    setDamageName(null);
                    setProductId(null);
                    setSelectedPrice(null);
                    setPriceOptions([]);
                    setCost(0.00);
                    setPrice(0.00);
                    setQuantity(0);
                    setAmount(0.00);
                    setStatus(2);
                    setIsDamageModalOpen(false);
                }
                fetchDamaged(selectedDamageStatus);
            }else{
                toastr.error("Error! There is something wrong in saving damage.");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "An error occurred while saving the damage.";
            toastr.error(errorMessage);
        }
    };

    const handleProductSearch = async (e) => {
        const search = e.target.value;
        setSearchProduct(search);
        if (search.length > 1) {
            try {
                const authToken = localStorage.getItem("token");
                const response = await axios.get("/api/fetch-products", {
                    params: { search: search },
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                setProductOptions(response.data);
                setShowDropdownProducts(true);
            } catch (error) {
                // console.error("Error fetching products:", error);
            }
        } else {
            setProductOptions([]);
            setShowDropdownProducts(false);
        }
    };

    const handleSelectProduct = (productSelected) => {
        setSearchProduct(productSelected.code+ '-' +productSelected.name_variant);
        setProductName(productSelected.name);
        setProductId(productSelected.id);
        setShowDropdownProducts(false);

        if (productSelected.pricing_list_available && productSelected.pricing_list_available.length > 0) {
            setPriceOptions(productSelected.pricing_list_available);
            const firstOption = productSelected.pricing_list_available[0];
            setSelectedPrice(firstOption?.id || null);
            setCost(firstOption?.cost || 0.00);
            setPrice(firstOption?.price || 0.00);
            setQuantity(1);
            setAmount((firstOption?.price * 1) || 0.00);
        } else {
            setSelectedPrice(null);
            setPriceOptions([]);
            setCost(0.00);
            setPrice(0.00);
            setAmount(0.00);
            setQuantity(1);
        }
    };

    const handlePriceChange = (e) => {
        const selectedPriceValue = parseFloat(e.target.value); 
    
        const selected = priceOptions.find(p => p.id === selectedPriceValue);
    
        if (selected) {
            setSelectedPrice(selected.id);
            setPrice(selected.price); 
            setCost(selected.cost);
            setQuantity(1);
        }
    };

    const handleDamageNew = () => {
        setDamageId(null);
        setDamageName(null);
        setProductId(null);
        setSearchProduct('');
        setSelectedPrice(null);
        setPriceOptions([]);
        setCost(0.00);
        setPrice(0.00);
        setQuantity(0);
        setAmount(0.00);
        setStatus(2);
        setIsDamageModalOpen(true);
    };

    const handleDamageEdit = (damage) => {

        setDamageId(damage.id);
        setProductId(damage.product_id);
        setSearchProduct(damage.product_info.name_variant);
        setPrice(damage.price);
        setPriceOptions(damage.product_info.pricing_list);
        setCost(damage.cost);
        setPrice(damage.price);
        setQuantity(damage.qty);
        setAmount(damage.amount);
        setStatus(damage.status_id);

        if (damage?.product_info?.pricing_list?.length > 0) {
            const matchedOption = damage.product_info.pricing_list.find(option =>
                parseFloat(option.cost) === parseFloat(damage.cost) &&
                parseInt(option.product_id) === parseInt(damage.product_id)
            );
    
            if (matchedOption) {
                setSelectedPrice(matchedOption.id);
            }
        }
        setIsDamageModalOpen(true);
    };

    const handleDamageClose = () => {
        setDamageId(null);
        setDamageName(null);
        setProductId(null);
        setSelectedPrice(null);
        setPriceOptions([]);
        setCost(0.00);
        setPrice(0.00);
        setQuantity(0);
        setAmount(0.00);
        setStatus("Active");
        setIsDamageModalOpen(false);
    };

    return (
        <Layout>
            <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Damaged</h1>
                    <button
                        onClick={handleDamageNew}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> New Damage
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search damaged..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                {/* Damage Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="border border-gray-300 px-4 py-2 text-left">Code</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Image</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Price</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Qty</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Remarks</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {damaged?.length > 0 ? (
                                damaged.map((damage, index) => (
                                    <tr key={damage.id}>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {damage.product_info?.code}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 flex justify-center">
                                            <img
                                                src={damage.product_info?.img}
                                                alt={damage.product_info.code}
                                                className="w-16 h-16 object-cover rounded cursor-pointer"
                                                onClick={() => handleImageClick(damage.product_info?.img)}
                                            />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {damage.product_info?.name_variant}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {damage.price}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {damage.qty}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {damage.amount}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <span className={`font-medium text-${damage.status_info?.color}-600`}>
                                                {damage.status_info?.name}
                                            </span>
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {damage.remarks}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 gap-2">
                                                {/* <button onClick={() => openSaleViewModal(sale)}
                                                    className="flex items-center gap-1 text-green-800 hover:text-green-600 hover:underline">
                                                    <Eye size={16} /> View
                                                </button> */}
                                            <button onClick={() => handleDamageEdit(damage)}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline">
                                                <Edit size={16} /> Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="border border-gray-300 px-4 py-2 text-center">
                                        No Damage found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {meta && (
                    <div className="flex justify-between items-center mt-4">
                        <button
                            disabled={!meta.prev}
                            onClick={() => setPage(page - 1)}
                            className={`px-4 py-2 rounded-lg ${meta.prev ? "text-white bg-blue-600 hover:bg-blue-500" : "bg-gray-200 cursor-not-allowed"}`}
                        >
                            Previous
                        </button>
                        <span>
                            Page {meta.current_page} of {meta.last_page}
                        </span>
                        <button
                            disabled={!meta.next}
                            onClick={() => setPage(page + 1)}
                            className={`px-4 py-2 rounded-lg ${meta.next ? "text-white bg-blue-600 hover:bg-blue-500" : "bg-gray-200 cursor-not-allowed"}`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {isDamageModalOpen && (
                <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative">
                        {/* Header */}
                        <div className="flex justify-between">
                            <h2 className="text-xl font-semibold">
                                {damageId ? "Edit Damage" : "New Damage"}
                            </h2>
                            <button 
                                onClick={handleDamageClose} 
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="mt-4">
                            {/* Damage Name */}
                            <label className="block text-sm font-medium">Product</label>
                            <div className="relative">
                                <input 
                                        type="text"
                                        placeholder="Search Product"
                                        value={searchProduct}
                                        onChange={handleProductSearch}
                                        className={`border px-3 py-2 rounded-lg w-full`}
                                        disabled={damageId}
                                    />
                                    {/* Dropdown */}
                                    {showDropdownProducts && productOptions.length > 0 && (
                                        <ul className="absolute left-0 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-60">
                                            {productOptions.map((product) => (
                                                <li 
                                                    key={product.id} 
                                                    className="p-2 cursor-pointer hover:bg-gray-200 flex items-center space-x-2"
                                                    onClick={() => handleSelectProduct(product)}
                                                >
                                                    <img
                                                        src={product.img}
                                                        alt={product.name}
                                                        className="w-16 h-16 object-cover rounded"
                                                    />
                                                    <span>{product.code}-{product.name_variant}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                            </div>

                            {/* Price, Quantity, Amount & Add Button */}
                            <div className="grid grid-cols-4 gap-2">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Price:</label>
                                    <select 
                                        value={selectedPrice}
                                        onChange={handlePriceChange}
                                        className="border px-3 py-2 rounded-lg w-full"
                                    >
                                        {priceOptions.length > 0 && priceOptions.map((priceOption) => (
                                                <option key={priceOption.id} 
                                                    value={priceOption.id} 
                                                    data-c={priceOption.cost}>
                                                    {priceOption.price} (Qty: {priceOption.qty})
                                                </option>
                                        ))}
                                    </select>
                                </div>                                
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Cost:</label>
                                    <input 
                                        type="number"
                                        value={cost}
                                        className="border px-3 py-2 rounded-lg w-full"
                                        disabled
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Qty:</label>
                                    <input 
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => {
                                            setQuantity(e.target.value);
                                            setAmount(price * e.target.value);
                                        }}
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Amount:</label>
                                    <input 
                                        type="number"
                                        value={amount}
                                        className="border px-3 py-2 rounded-lg w-full"
                                        disabled
                                    />
                                </div>
                            </div>
                            
                            
                            <label className="block text-sm font-medium text-gray-700">Status:</label>
                            <div className="relative">
                                <select 
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="border px-3 py-2 rounded-lg w-full"
                                >
                                    {damageId && status==1 &&
                                        <option key="1" 
                                            value="1">
                                            Returned by Customer
                                        </option>
                                    }
                                    {statusOptions?.map((statusOption) => (
                                        <option key={statusOption.id} 
                                            value={statusOption.id}>
                                            {statusOption.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                                
                            <label className="block text-sm font-medium text-gray-700">Remarks:</label>
                            <div className="relative">
                                <textarea 
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    rows="3"
                                    placeholder="Enter remarks here..."
                                ></textarea>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                Save Damage
                            </button>

                        </form>

                    </div>
                </div>
            )}

        </Layout>
    );

};

export default Damaged;