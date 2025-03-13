import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Layout from "./Layout";
import { Edit, Eye, Plus, X } from "lucide-react";
import Swal from "sweetalert2";
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import "react-datepicker/dist/react-datepicker.css";

const Services = () => {
    const [services, setServices] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedServiceStatus, setSelectedServiceStatus] = useState("Available");
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [serviceId, setServiceId] = useState(null);
    const [serviceName, setServiceName] = useState(null);
    const [servicePrice, setServicePrice] = useState(null);
    const [laborCost, setLaborCost] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [estimateDuration, setEstimateDuration] = useState(null);
    const [remarks, setRemarks] = useState(null);
    const [status, setStatus] = useState("Available");
    const [productsList, setProductsList] = useState([]);
    const [productsSelected, setProductsSelected] = useState([]);    
    const [searchProduct, setSearchProduct] = useState(null);
    const [showDropdownProducts, setShowDropdownProducts] = useState(false);
    const [productId, setProductId] = useState(null);
    const [productName, setProductName] = useState(null);
    const [productCost, setProductCost] = useState(0);
    const [productQty, setProductQty] = useState(0);
    const [productTotalCost, setProductTotalCost] = useState(0);
    const [step, setStep] = useState(1);
    const didFetch = useRef(false);
    
    useEffect(() => {
        if (didFetch.current) return;
        didFetch.current = true;

        fetchServices(selectedServiceStatus);
    }, [search, page, selectedServiceStatus]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const fetchServices = async (filter) => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/services`, {
                params: {
                    search: search,
                    page: page,
                    filter: filter
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setServices(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            // console.error("Error fetching services:", error);
        }
    };

    const handleStep2 = (e) => {
        e.preventDefault(); setStep(2);
        
        if (!serviceName || !servicePrice || !laborCost) {
            toastr.error("Please input Service name, Service Price and Labor Cost!");
            return;
        }
    }

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
                setProductsList(response.data);
                setShowDropdownProducts(true);
            } catch (error) {
                // console.error("Error fetching products:", error);
            }
        } else {
            setProductsList([]);
            setShowDropdownProducts(false);
        }
    };

    const handleSelectProduct = (product) => {
        setProductId(null);
        setProductCost(0);
        setProductTotalCost(0);

        setSearchProduct(product.name_variant);
        setProductName(product.name_variant);
        setProductId(product.id);
        setProductCost(product.cost);
        setProductQty(1);
        setProductTotalCost(product.cost);

        setShowDropdownProducts(false);
    };

    const handleChangeProductQty = (inputQty) => {
        const qty = parseFloat(inputQty);

        if (!isNaN(qty) && qty >= 0) {
            setProductQty(qty);
            setProductTotalCost(qty * productCost);
        } else {
            setProductQty(0);
            setProductTotalCost(0);
        }
    }

    const handleAddProduct = () => {
        if(productId==null){
            toastr.warning("No product selected!");
            return;
        } 

        if(productQty<=0){
            toastr.warning("Product quantity must be greater than 0!");
            return;
        }

        const newProduct = {
            id: productId,
            name: productName,
            cost: productCost,
            qty: productQty,
            total: productTotalCost
        };
    
        setProductsSelected((prevProducts) => [...prevProducts, newProduct]);
        
        setSearchProduct("");
        setProductName(null);
        setProductId(null);
        setProductCost(0);
        setProductQty(0);
        setProductTotalCost(0);
    };

    const handleRemoveProduct = (product, index) => {
        
        Swal.fire({
            title: `Remove ${product.name}?`,
            text: `Are you sure you want to remove "${product.name}" costed at ${product.cost}? This action cannot be undone!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, remove it!",
        }).then((result) => {
            if (result.isConfirmed) {
                if(serviceId!=null){

                }
                setProductsSelected(productsList.filter((_, i) => i !== index));
                
                Swal.fire("Removed!", `"${product.name}" has been removed.`, "success");
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!serviceName || !servicePrice || !laborCost) {
            toastr.error("Please input Service name, Service Price and Labor Cost!");
            return;
        }

        if (!productsSelected.length) {
            toastr.error("Please select product atleast 1!");
            return;
        }

        try {
            const formData = {
                serviceId: serviceId,
                serviceName: serviceName,
                servicePrice: servicePrice,
                laborCost: laborCost,
                discount: discount,
                status: status,
                estimateDuration: estimateDuration,
                remarks: remarks,
                productsSelected: productsSelected
            };

            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/services/manage`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                setServiceId(null);
                setServiceName(null);
                setServicePrice(null);
                setLaborCost(null);
                setDiscount(0);
                setStatus("Available");
                setEstimateDuration(null);
                setRemarks(null);
                setProductsSelected([]);
                setIsServiceModalOpen(false);
                fetchServices();
            }else{
                toastr.error("Error! There is something wrong in saving service.");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "An error occurred while saving the service.";
            toastr.error(errorMessage);
        }
    };

    const handleServiceNew = () => {
        setServiceId(null);
        setServiceName(null);
        setServicePrice(null);
        setLaborCost(null);
        setDiscount(0);
        setStatus("Available");
        setEstimateDuration(null);
        setRemarks(null);
        setProductsSelected([]);
        setIsServiceModalOpen(true);
    };

    const handleServiceEdit = (service) => {
        setServiceId(service.id);
        setServiceName(service.name);
        setServicePrice(service.contact_person);
        setLaborCost(service.contact_no);
        setDiscount(service.discount_address);
        setStatus(service.service_status);
        setIsServiceModalOpen(true);
    };

    const handleServiceClose = () => {
        setServiceId(null);
        setServiceName(null);
        setServicePrice(null);
        setLaborCost(null);
        setDiscount(0);
        setStatus("Available");
        setEstimateDuration(null);
        setRemarks(null);
        setProductsSelected([]);
        setIsServiceModalOpen(false);
    };

    return (
        <Layout>
            <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto max-w-7xl mt-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Services</h1>
                    <button
                        onClick={handleServiceNew}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> New Service
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                {/* Service Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="border border-gray-300 px-4 py-2 text-left">Type of Service</th>                                
                                <th className="border border-gray-300 px-4 py-2 text-left">Price</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Costs</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Income</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Estimate Duration</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Remarks</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services?.length > 0 ? (
                                services.map((service, index) => {
                                    const totalCostProduct = service.products?.reduce((sum, product) => {
                                        return sum + product.product.cost * product.qty;
                                      }, 0) || 0;
                                    const totalCost = Number(totalCostProduct) + Number(service.labor_cost) + Number(service.discount);
                                    const income = Number(service.price) - totalCost;
                                    return (
                                        <tr key={service.id}>
                                            <td className="border border-gray-300 px-4 py-2">{service.name}</td>
                                            <td className="border border-gray-300 px-4 py-2">{service.price}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <div className="text-sm">
                                                    <div><span className="font-medium">Product:</span>₱{totalCostProduct.toFixed(2)}</div>
                                                    <div><span className="font-medium">Labor:</span> ₱{service.labor_cost}</div>
                                                    <div><span className="font-medium">Discount:</span> ₱{service.discount}</div>
                                                    <div><span className="font-medium">Total:</span> ₱{totalCost}</div>
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">₱ {income}</td>
                                            <td className="border border-gray-300 px-4 py-2">{service.estimate_duration}</td>
                                            <td className="border border-gray-300 px-4 py-2">{service.remarks}</td>
                                            <td className="border border-gray-300 px-4 py-2 gap-2">
                                                    {/* <button onClick={() => openSaleViewModal(sale)}
                                                        className="flex items-center gap-1 text-green-800 hover:text-green-600 hover:underline">
                                                        <Eye size={16} /> View
                                                    </button> */}
                                                <button onClick={() => handleServiceEdit(service)}
                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline">
                                                    <Edit size={16} /> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="10" className="border border-gray-300 px-4 py-2 text-center">
                                        No Service found.
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

            {isServiceModalOpen && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative">
                        {/* Header */}
                        <div className="flex justify-between">
                            <h2 className="text-xl font-semibold">
                                {serviceId ? "Edit Service" : "New Service"}
                            </h2>
                            <button 
                                onClick={handleServiceClose} 
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Step Indicators */}
                        <div className="flex justify-center mb-4">
                            <span className={`px-4 py-2 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>Service Info</span>
                            <span className={`px-4 py-2 rounded-full ml-2 ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>Products Used</span>
                        </div>

                        {/* Step 1: Service Info */}
                        {step === 1 && (           
                            <form onSubmit={(e) => { handleStep2(e); }} className="mt-4">
                                {/* Service Name */}
                                <label className="block text-sm font-medium">Service Name:</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={serviceName}
                                        onChange={(e) => setServiceName(e.target.value)}
                                        className="w-full p-2 border rounded"
                                        placeholder="Service Name..."
                                    />
                                </div>
                                {/* Service Price */}
                                <label className="block text-sm font-medium mt-2">Service Price:</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={servicePrice}
                                        onChange={(e) => setServicePrice(e.target.value)}
                                        className="w-full p-2 border rounded"
                                        placeholder="Service Price..."
                                    />
                                </div>
                                {/* Labor Cost */}
                                <label className="block text-sm font-medium mt-2">Labor Cost:</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={laborCost}
                                        onChange={(e) => setLaborCost(e.target.value)}
                                        className="w-full p-2 border rounded"
                                        placeholder="Labor Cost"
                                    />
                                </div>
                                {/* Discount */}
                                <label className="block text-sm font-medium mt-2">Discount:</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        className="w-full p-2 border rounded"
                                        placeholder="Discount"
                                    />
                                </div>
                                {/* Estimate Duration */}
                                <label className="block text-sm font-medium mt-2">Estimate Duration:</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={estimateDuration}
                                        onChange={(e) => setEstimateDuration(e.target.value)}
                                        className="w-full p-2 border rounded"
                                        placeholder="Estimate Duration"
                                    />
                                </div>
                                {/* Status */}
                                <label className="block text-sm font-medium mt-2">Status:</label>
                                <div className="relative">
                                    <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    >
                                    <option value="Available">Available</option>
                                    <option value="Unavailable">Unavailable</option>
                                    </select>
                                </div>
                                {/* Remarks */}
                                <label className="block text-sm font-medium mt-2">Remarks:</label>
                                    <div className="relative">
                                    <textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        className="w-full p-2 border rounded resize-none"
                                        placeholder="Enter remarks about the service..."
                                        rows={3}
                                    ></textarea>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="mt-4 p-2 bg-blue-600 text-white rounded hover:bg-blue-800 transition"
                                >
                                    Next: Add Products
                                </button>

                            </form>
                        )}

                        {/* Step 2: Add Products */}
                        {step === 2 && (
                            <div className="w-full mt-4">
                                <div className="grid grid-cols-4 gap-2">
                                    {/* Product Search & Selection */}
                                    <div className="col-span-2 w-full">
                                        <label className="block text-sm font-medium text-gray-700">Product:</label>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                placeholder="Search Product"
                                                value={searchProduct}
                                                onChange={handleProductSearch}
                                                className="border px-3 py-2 rounded-lg w-full"
                                            />
                                            {/* Dropdown */}
                                            {showDropdownProducts && productsList?.length > 0 && (
                                                <ul className="absolute left-0 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                                                    {productsList.map((product) => (
                                                        <li 
                                                            key={product.id} 
                                                            className="p-2 cursor-pointer hover:bg-gray-200"
                                                            onClick={() => handleSelectProduct(product)}
                                                        >
                                                            {product.name_variant}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full">
                                        <label className="block text-sm font-medium text-gray-700">Qty:</label>
                                        <input 
                                            type="number"
                                            value={productQty}
                                            onChange={(e) => handleChangeProductQty(e.target.value)}
                                            className="border px-3 py-2 rounded-lg w-full"
                                        />
                                    </div>
                                    <div className="w-full flex items-end">
                                        <button
                                        onClick={handleAddProduct}
                                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-gray-600"
                                        >
                                        Add Product
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <table className="w-full mt-4 border border-gray-300 text-sm">
                                        <thead className="bg-gray-100 text-gray-700">
                                            <tr>
                                            <th className="border px-4 py-2 text-left">Product Name</th>
                                            <th className="border px-4 py-2 text-left">Unit Cost</th>
                                            <th className="border px-4 py-2 text-left">Quantity</th>
                                            <th className="border px-4 py-2 text-left">Total</th>
                                            <th className="border px-4 py-2 text-left">Actions</th>
                                            </tr>
                                        </thead>  
                                        <tbody>
                                            {productsSelected?.map((product, index) => (
                                            <tr key={index}>
                                                <td className="border px-4 py-2">{product.name}</td>
                                                <td className="border px-4 py-2">₱{Number((product.cost)).toFixed(2)}</td>
                                                <td className="border px-4 py-2">{product.qty}</td>
                                                <td className="border px-4 py-2">₱{Number((product.total)).toFixed(2)}</td>
                                                <td className="border px-4 py-2">
                                                <button
                                                    onClick={() => handleRemoveProduct(product, index)}
                                                    className="text-red-500 hover:underline text-sm"
                                                >
                                                    <X size={24} />
                                                </button>
                                                </td>
                                            </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-4">
                                    <button
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                    >
                                    Back
                                    </button>
                                    <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800"
                                    >
                                    Save Service
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </Layout>
    );

};

export default Services;