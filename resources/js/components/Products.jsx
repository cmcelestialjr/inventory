import React, { useEffect, useState, useRef } from "react";
import { Pencil, Trash, Plus, X, Package, CheckCircle, XCircle, AlertTriangle, Recycle  } from "lucide-react";
import Layout from "./Layout";
import axios from 'axios';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);  
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [pricingErrors, setPricingErrors] = useState({});
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [productCategories, setProductCategories] = useState({});
  const [filterType, setFilterType] = useState("all");
  const [modalImageOpen, setModalImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const didFetch = useRef(false);
  const [summary, setSummary] = useState({
    total: 0,
    available: 0,
    out_of_stock: 0,
    low_stock: 0,
    phaseout: 0,
  });
  const [editFormData, setEditFormData] = useState({ 
    id: "", 
    code: "", 
    name: "",
    variant: "",
    productCategoryId: "",
  });
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    variant: "",
    cost: "",
    price: "",
    qty: "",
    productCategoryId: "",
    effective_date: null,
  });
  const [selectedPricing, setSelectedPricing] = useState({
    id: "",
    cost: "",
    price: "",
    qty: "",
    effective_date: null,
  });  

  useEffect(() => {
    fetchProducts(filterType);
  }, [search, page]);

  useEffect(() => {
    if (didFetch.current) return;
        didFetch.current = true;
    const fetchSummary = async () => {
      try {
        const authToken = localStorage.getItem("token");
        const response = await axios.get("/api/products/summary", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setSummary(response.data);
        
      } catch (error) {
        // console.error("Error fetching summary:", error);
      }
    };

    const fetchProductCategories = async () => {
      try {
        const authToken = localStorage.getItem("token");
        const response = await axios.get("/api/products/categories", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setProductCategories(response.data);
      } catch (error) {
        // console.error("Error fetching summary:", error);
      }
    };
  
    fetchSummary();
    fetchProductCategories();
  }, []);

  const handleFilter = (filterType) => {
    setFilterType(filterType);
    fetchProducts(filterType);
  };

  const fetchProducts = async (filter) => {
    try {
      const authToken = localStorage.getItem("token");
      const response = await axios.get(`/api/products?search=${search}&filter=${filter}&page=${page}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setProducts(response.data.data);
      setMeta(response.data.meta || {});
    } catch (error) {
      // console.error("Error fetching products:", error);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleImageClick = (imgSrc) => {
    setSelectedImage(imgSrc);
    setModalImageOpen(true);
  };

  const closeImageModal = () => {
    setModalImageOpen(false);
    setSelectedImage(null);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (e.target.name === "productCategoryId") {
      if(e.target.value!=""){
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
        const authToken = localStorage.getItem("token");

        const formDataCategory = {
          id: e.target.value
        };

        const response = await axios.post(
          "/api/product/category/code",
          formDataCategory,
          {
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-TOKEN": csrfToken,
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        
        if (response.status === 200 || response.status === 201) {
          if(response.data.message=="success"){
            setFormData((prevFormData) => ({
              ...prevFormData,
              code: response.data.code,
              [name]: value,
            }));
          
          }
        }
      }else{
        setFormData((prevFormData) => ({
          ...prevFormData,
          code: "",
          [name]: value,
        }));
      }
      
    }else{
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: value,
      }));
    }
    if (e.target.value.trim() !== "") {
      setErrors((prevErrors) => ({ ...prevErrors, [e.target.name]: null }));
    }
    
  };

  // Handle date change
  const handleDateChange = (date) => {
    setFormData({ ...formData, effective_date: date });

    if (date) {
      setErrors((prevErrors) => ({ ...prevErrors, effective_date: null }));
    }
  };

  const handlePricingDateChange = (date) => {
    setSelectedPricing((prev) => ({
      ...prev,
      effective_date: date,
    }));
  };
  

  // Validate Form
  const validateForm = () => {
    let newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (!formData[key]) {
        newErrors[key] = "This field is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
        const authToken = localStorage.getItem("token");

        const response = await axios.post(
          "/api/products/store",
          formData,
          {
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-TOKEN": csrfToken,
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if(response.data.message=="success"){
          fetchProducts(filterType);
          toastr.success("Product added successfully!");
          setShowModal(false);
          setFormData({
            code: "",
            name: "",
            variant: "",
            cost: "",
            price: "",
            qty: "",
            productCategoryId: "",
            effective_date: null,
          });
          setErrors({});
        }else{
          toastr.error(response.data.message);
        }      

      } catch (error) {
        toastr.error("Failed to add product.", error);
      }
      
    }
  };

  const openEditModal = (product) => {
    setEditFormData({
      id: product.id,
      code: product.code,
      name: product.name,
      variant: product.variant,
      productCategoryId: product.product_category_id,
      pricingList: product.pricing_list || [],
    });
    setShowEditModal(true);
  };

  const validateEditForm = () => {
    let newErrors = {};
    Object.keys(editFormData).forEach((key) => {
      if (!editFormData[key]) {
        newErrors[key] = "This field is required";
      }
    });
  
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  
  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    if (e.target.value.trim() !== "") {
      setEditErrors((prevErrors) => ({ ...prevErrors, [e.target.name]: null }));
    }
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (validateEditForm()) {
      try {
        const token = localStorage.getItem("token");
        await axios.put(`/api/products/${editFormData.id}`, editFormData, {
          headers: { Authorization: `Bearer ${token}` },
        });
    
        toastr.success("Product updated successfully!");
        fetchProducts(filterType);
      } catch (error) {
        toastr.error("Error updating product");
      }
    }
  };

  const openEditPricingModal = (pricing) => {
    setSelectedPricing(pricing);
    setShowPricingModal(true);
  };

  const handleSavePricing = async () => {
    let errors = {};
  
    if (!selectedPricing.cost) errors.cost = "Cost is required.";
    if (!selectedPricing.price) errors.price = "Price is required.";
    if (!selectedPricing.qty) errors.qty = "Quantity is required.";
    if (!selectedPricing.effective_date) errors.effective_date = "Effective Date is required.";
  
    if (Object.keys(errors).length > 0) {
      setPricingErrors(errors);
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const formattedData = {
        ...selectedPricing,
        effective_date: selectedPricing.effective_date
          ? new Date(selectedPricing.effective_date).toISOString().split("T")[0]
          : null,
      };
      var check = 0;
      if (selectedPricing.id) {
        const response = await axios.put(`/api/product-pricing/${selectedPricing.id}`, formattedData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if(response.data.message=="success"){
          toastr.success("Product Pricing updated successfully!");
          check = 1;
        }else{
          toastr.error(response.data.message);
        }  
      } else {
        const response = await axios.post(`/api/product-pricing`, formattedData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if(response.data.message=="success"){
          toastr.success("Successfuly add the New Pricing of the product!");
          check = 1;
        }else{
          toastr.error(response.data.message);
        }        
      }
      if(check==1){
        setEditFormData((prevData) => ({
          ...prevData,
          pricingList: selectedPricing.id
            ? prevData.pricingList.map((p) => (p.id === selectedPricing.id ? formattedData : p))
            : [...prevData.pricingList, formattedData],
        }));
        fetchProducts(filterType);
        setShowPricingModal(false);
      }
    } catch (error) {
      toastr.error("Error saving pricing:", error.response?.data);
    }
  };
  
  
  const openNewPricingModal = (productId) => {
    setSelectedPricing({
      id: "",
      product_id: productId,
      cost: "",
      price: "",
      qty: "",
      effective_date: null,
    });
    setShowPricingModal(true);
  };

  return (
    <Layout>
      <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-10">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Products</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            <Plus size={18} /> New Product
          </button>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {/* Total Products */}
          <button
            onClick={() => handleFilter("all")}
            className={`flex flex-col items-center p-3 rounded-xl shadow-md transition transform hover:scale-105 ${
              filterType === "all" ? "bg-blue-600 text-white" : "bg-white border border-gray-300"
            }`}
          >
            <Package size={28} className={`${filterType === "all" ? "text-white" : "text-blue-600"}`} />
            <span className="mt-2 text-base font-semibold">Total Products</span>
            <span className="text-lg font-bold">{summary.total}</span>
          </button>

          {/* Available Products */}
          <button
            onClick={() => handleFilter("available")}
            className={`flex flex-col items-center p-3 rounded-xl shadow-md transition transform hover:scale-105 ${
              filterType === "available" ? "bg-green-600 text-white" : "bg-white border border-gray-300"
            }`}
          >
            <CheckCircle size={28} className={`${filterType === "available" ? "text-white" : "text-green-600"}`} />
            <span className="mt-2 text-base font-semibold">Available</span>
            <span className="text-lg font-bold">{summary.available}</span>
          </button>

          {/* Out of Stock */}
          <button
            onClick={() => handleFilter("out-of-stock")}
            className={`flex flex-col items-center p-3 rounded-xl shadow-md transition transform hover:scale-105 ${
              filterType === "out-of-stock" ? "bg-red-600 text-white" : "bg-white border border-gray-300"
            }`}
          >
            <XCircle size={28} className={`${filterType === "out-of-stock" ? "text-white" : "text-red-600"}`} />
            <span className="mt-2 text-base font-semibold">Out of Stock</span>
            <span className="text-lg font-bold">{summary.out_of_stock}</span>
          </button>

          {/* Low Stock */}
          <button
            onClick={() => handleFilter("low-stock")}
            className={`flex flex-col items-center p-3 rounded-xl shadow-md transition transform hover:scale-105 ${
              filterType === "low-stock" ? "bg-yellow-600 text-white" : "bg-white border border-gray-300"
            }`}
          >
            <AlertTriangle size={25} className={`${filterType === "low-stock" ? "text-white" : "text-yellow-600"}`} />
            <span className="mt-2 text-base font-semibold">Low Stock</span>
            <span className="text-lg font-bold">{summary.low_stock}</span>
          </button>

          {/* Phaseout Stock */}
          <button
            onClick={() => handleFilter("phaseout")}
            className={`flex flex-col items-center p-3 rounded-xl shadow-md transition transform hover:scale-105 ${
              filterType === "phaseout" ? "bg-yellow-600 text-white" : "bg-white border border-gray-300"
            }`}
          >
            <Recycle size={25} className={`${filterType === "phaseout" ? "text-white" : "text-gray-600"}`} />
            <span className="mt-2 text-base font-semibold">Phaseout</span>
            <span className="text-lg font-bold">{summary.phaseout}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={handleSearch}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border border-gray-300 px-4 py-2 text-left">Code</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Image</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Variant</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Cost</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Price</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Qty</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product, index) => (
                  <tr key={product.id}>
                    <td className="border border-gray-300 px-4 py-2">{product.code}</td>
                    <td className="border border-gray-300 px-4 py-2 flex justify-center">
                      <img
                        src={product.img}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded cursor-pointer"
                        onClick={() => handleImageClick(product.img)}
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{product.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{product.variant}</td>
                    <td className="border border-gray-300 px-4 py-2">{product.cost}</td>
                    <td className="border border-gray-300 px-4 py-2">{product.price}</td>
                    <td className="border border-gray-300 px-4 py-2">{product.qty}</td>
                    <td className="border border-gray-300 px-4 py-2 gap-2">
                      <button onClick={() => openEditModal(product)}
                        className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Pencil size={16} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="border border-gray-300 px-4 py-2 text-center">
                    No products found.
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

        {/* Modal Component */}
        {showModal && (
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-[500px] md:w-[600px] shadow-lg">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Add New Product</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Category:</label>
                    <select
                      name="productCategoryId"
                      value={formData.productCategoryId}
                      onChange={handleChange}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none ${
                        errors.productCategoryId ? "border-red-500" : "border-gray-300"
                      }`}
                      wrapperClassName={`w-full ${
                        errors.productCategoryId ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Please select category...</option>
                      {productCategories?.map((category) => (
                        <option key={category.id} 
                          value={category.id}>
                            {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Code</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                        errors.code ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }`}                      
                    />
                  </div>                  
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                        errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }`}                      
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Variant</label>
                    <input
                      type="text"
                      name="variant"
                      value={formData.variant}
                      onChange={handleChange}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                        errors.variant ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cost</label>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleChange}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                        errors.cost ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }`}                      
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                        errors.price ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }`}                      
                    />
                  </div>                  
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      name="qty"
                      value={formData.qty}
                      onChange={handleChange}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                        errors.qty ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }`}                      
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Effective Date:</label>
                    <DatePicker
                      selected={formData.effective_date}
                      onChange={handleDateChange}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none ${
                        errors.effective_date ? "border-red-500" : "border-gray-300"
                      }`}
                      wrapperClassName={`w-full ${
                        errors.effective_date ? "border-red-500" : "border-gray-300"
                      }`}
                      dateFormat="MM-dd-yyyy"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-[500px] md:w-[600px] shadow-lg">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Edit Product</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Code</label>
                    <input
                      type="text"
                      name="code"
                      value={editFormData.code}
                      onChange={handleEditChange}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                        editErrors.code ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                        editErrors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Variant</label>
                    <input
                      type="text"
                      name="variant"
                      value={editFormData.variant}
                      onChange={handleEditChange}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                        editErrors.variant ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Category:</label>
                    <select
                      name="productCategoryId"
                      value={editFormData.productCategoryId}
                      onChange={handleEditChange}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none ${
                        editErrors.productCategoryId ? "border-red-500" : "border-gray-300"
                      }`}
                      wrapperClassName={`w-full ${
                        editErrors.productCategoryId ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Please select category...</option>
                      {productCategories?.map((category) => (
                        <option key={category.id} 
                          value={category.id}>
                            {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="submit"                    
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                  >
                    Save Changes
                  </button>
                </div>
                {editFormData.pricingList.length > 0 ? (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Pricing List</h3>
                      <button
                        type="button"
                        onClick={() => openNewPricingModal(editFormData.id)}
                        className="bg-green-600 text-white text-sm px-3 py-1 rounded-md hover:bg-green-700 transition"
                      >
                        New Pricing
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-h-48 overflow-y-auto p-2 border rounded-lg shadow-md">
                      {editFormData.pricingList.map((pricing, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg shadow-sm bg-white flex flex-col justify-between"
                        >
                          <div>
                            <p className="text-xl font-semibold text-blue-600">{pricing.price}</p>
                            <p className="text-sm text-gray-500">Cost: {pricing.cost}</p>
                            <p className="text-sm text-gray-500">Qty: {pricing.qty}</p>
                            <p className="text-xs text-gray-400">
                              Effective Date: {new Date(pricing.effective_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openEditPricingModal(pricing)}
                            className="mt-2 bg-blue-500 text-white text-sm py-1 px-2 rounded-md hover:bg-blue-600 transition"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No pricing details available.</p>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPricingModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-semibold mb-4">
                {selectedPricing.id ? "Edit Pricing" : "New Pricing"}
              </h3>

              {/* Cost Input */}
              <label className="block mb-2">Cost:</label>
              <input
                type="number"
                value={selectedPricing.cost}
                onChange={(e) => setSelectedPricing({ ...selectedPricing, cost: e.target.value })}
                className={`w-full border p-2 rounded-md ${
                  pricingErrors.cost ? "border-red-500" : "border-gray-300"
                }`}
              />

              {/* Price Input */}
              <label className="block mb-2 mt-3">Price:</label>
              <input
                type="number"
                value={selectedPricing.price}
                onChange={(e) => setSelectedPricing({ ...selectedPricing, price: e.target.value })}
                className={`w-full border p-2 rounded-md ${
                  pricingErrors.price ? "border-red-500" : "border-gray-300"
                }`}
              />

              {/* Quantity Input */}
              <label className="block mb-2 mt-3">Quantity:</label>
              <input
                type="number"
                value={selectedPricing.qty}
                onChange={(e) => setSelectedPricing({ ...selectedPricing, qty: e.target.value })}
                className={`w-full border p-2 rounded-md ${
                  pricingErrors.qty ? "border-red-500" : "border-gray-300"
                }`}
              />

              {/* Effective Date Picker */}
              <label className="block mb-2 mt-3">Effective Date:</label>
              <DatePicker
                selected={selectedPricing.effective_date}
                onChange={(date) => setSelectedPricing({ ...selectedPricing, effective_date: date })}
                className={`w-full border px-3 py-2 rounded-lg focus:outline-none ${
                  pricingErrors.effective_date ? "border-red-500" : "border-gray-300"
                }`}
                dateFormat="MMMM d, yyyy"
              />

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowPricingModal(false)} className="text-gray-600">
                  Cancel
                </button>
                <button onClick={handleSavePricing} className="bg-blue-600 text-white px-4 py-2 rounded-md">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {modalImageOpen && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-4 rounded-lg w-full max-w-2xl max-h-[90vh]">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full max-h-[80vh] object-cover"
              />
              <button
                onClick={closeImageModal}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        
        )}

      </div>
    </Layout>
  );
};

export default Products;
