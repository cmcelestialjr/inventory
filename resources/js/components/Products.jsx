import React, { useEffect, useState, useRef } from "react";
import { Pencil, Trash, Plus, X, Package, CheckCircle, XCircle, AlertTriangle, Recycle, Boxes, Puzzle, Bolt, Printer, ZapOff, View  } from "lucide-react";
import Layout from "./Layout";
import axios from 'axios';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toastr from 'toastr';
import Swal from "sweetalert2";
import 'toastr/build/toastr.min.css';
import AsyncSelect from "react-select/async";

const Products = () => {
  const [activeTab, setActiveTab] = useState("lists");
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [productsSales, setProductsSales] = useState([]);
  const [metaProductsSales, setMetaProductsSales] = useState(null);
  const [searchProductsSales, setSearchProductsSales] = useState("");
  const [pageProductsSales, setPageProductsSales] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);  
  const [showViewProductSalesModal, setShowViewProductSalesModal] = useState(false);  
  const [selectedProductsSales, setSelectedProductsSales] = useState(null);
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [pricingErrors, setPricingErrors] = useState({});
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [productCategories, setProductCategories] = useState({});
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState(null);  
  const [modalImageOpen, setModalImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageProductId, setSelectedImageProductId] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc"); 
  const [sortColumnProductsSales, setSortColumnProductsSales] = useState(null);
  const [sortOrderProductsSales, setSortOrderProductsSales] = useState("asc"); 
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedSupplierModal, setSelectedSupplierModal] = useState(null);
  const [isImageEditing, setIsImageEditing] = useState(false);
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(selectedImage);
  const fileInputRef = useRef(null);
  const didFetch = useRef(false);
  const [dateRange, setDateRange] = useState([
    new Date(),
    new Date(),
  ]);
  const [startDate, endDate] = dateRange;
  const [summary, setSummary] = useState({
    total: 0,
    available: 0,
    out_of_stock: 0,
    low_stock: 0,
    phaseout: 0,
    damaged: 0
  });
  const [categoriesCount, setCategoriesCount] = useState({
    main: 0,
    accessories: 0,
    boltsNscrews: 0,
  });
  const [editFormData, setEditFormData] = useState({ 
    id: "", 
    code: "", 
    name: "",
    variant: "",
    productCategoryId: "",
    product_status: "Available",
    track: 'Y'
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
    supplierId: null,
    track: 'Y'
  });
  const [selectedPricing, setSelectedPricing] = useState({
    id: "",
    cost: "",
    price: "",
    qty: "",
    supplierId: null,
    effective_date: null,
  });  

  useEffect(() => {
    fetchProducts(filterType,filterCategory);
  }, [search, page, sortColumn, sortOrder, filterType, filterCategory, selectedSupplier]);

  useEffect(() => {
    fetchProductsSales();
  }, [searchProductsSales, pageProductsSales, sortColumnProductsSales, sortOrderProductsSales, startDate, endDate]);

  useEffect(() => {
    fetchCategoriesCount(filterType);
  }, [filterType]);

  // useEffect(() => {
  //   fetchSuppliers();
  // }, [supplierSearch]);

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
    fetchProducts(filterType,filterCategory);
  };

  const handleFilterCategories = (filterCategory) => {
    setFilterCategory(filterCategory);
    fetchProducts(filterType,filterCategory);
  };
  
  const fetchProducts = async (filter,filterCategory) => {
    
    try {
      const numericSelectedCategory = (selectedSupplier || []).map((item) => Number(item.value));
      const authToken = localStorage.getItem("token");
      const response = await axios.get(`/api/products`, {
        params: {
          search: search,
          page: page,
          filter: filter,
          filterCategory: filterCategory,
          suppliers: numericSelectedCategory,
          sort_column: sortColumn, 
          sort_order: sortOrder,
      },
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setProducts(response.data.data);
      setMeta(response.data.meta || {});
    } catch (error) {
      // console.error("Error fetching products:", error);
    }
  };

  const fetchProductsSales = async () => {
    
    try {
      const authToken = localStorage.getItem("token");
      const response = await axios.get(`/api/products/sales`, {
        params: {
          search: searchProductsSales,
          page: pageProductsSales,
          sort_column: sortColumnProductsSales, 
          sort_order: sortOrderProductsSales,
          start_date: startDate ? startDate.toISOString().split("T")[0] : null,
          end_date: endDate ? endDate.toISOString().split("T")[0] : null,
      },
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setProductsSales(response.data.data);
      setMetaProductsSales(response.data.meta || {});
    } catch (error) {
      // console.error("Error fetching products:", error);
    }
  };

  const fetchCategoriesCount = async (filter) => {
    try {
      const authToken = localStorage.getItem("token");
      const response = await axios.get(`/api/products/categoriesCount`, {
        params: {
          filter: filter
      },
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setCategoriesCount(response.data);
    } catch (error) {
      // console.error("Error fetching products:", error);
    }
  };

  const handleSort = (column) => {
    const newSortOrder = 
        sortColumn === column && sortOrder === "asc" ? "desc" : "asc";

    setSortColumn(column);
    setSortOrder(newSortOrder);
};

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSortProductsSales = (column) => {
    const newSortOrder = 
        sortColumnProductsSales === column && sortOrderProductsSales === "asc" ? "desc" : "asc";

    setSortColumnProductsSales(column);
    setSortOrderProductsSales(newSortOrder);
};

  const handleSearchProductsSales = (e) => {
    setSearchProductsSales(e.target.value);
    setPageProductsSales(1);
  };

  const handleImageEditClick = () => {
    setIsImageEditing(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setNewImageFile(file);
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleImageClick = (imgSrc,productId) => {
    setSelectedImageProductId(productId);
    setSelectedImage(imgSrc);
    setPreviewImage(imgSrc);
    setModalImageOpen(true);
  };

  const handleImageClose = () => {
    setModalImageOpen(false);
    setSelectedImageProductId(null);
    setSelectedImage(null);
    setIsImageEditing(false);
    setNewImageFile(null);
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

        const cleanFormData = {
          ...formData,
          supplierId: formData.track === 'N' ? 1 : formData.supplierId?.value ?? null,
        };

        const response = await axios.post(
          "/api/products/store",
          cleanFormData,
          {
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-TOKEN": csrfToken,
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if(response.data.message=="success"){
          fetchProducts(filterType,filterCategory);
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
            supplierId: null,
            effective_date: null,
            track: 'Y'
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
      product_status: product.product_status,
      track: product.track,
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
        fetchProducts(filterType,filterCategory);
      } catch (error) {
        toastr.error("Error updating product");
      }
    }
  };

  const openEditPricingModal = (pricing) => {
    setSelectedPricing({
      ...pricing,
      supplierId: {
        value: pricing.supplier_id,
        label: pricing.supplier?.name || 'Unknown Supplier',
      },
    });

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
        supplierId: selectedPricing.supplierId?.value ?? null,
      };
      let response;
      var check = 0;
      if (selectedPricing.id) {
        response = await axios.put(`/api/product-pricing/${selectedPricing.id}`, formattedData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if(response.data.message=="success"){
          toastr.success("Product Pricing updated successfully!");
          check = 1;
        }else{
          toastr.error(response.data.message);
        }  
      } else {
        response = await axios.post(`/api/product-pricing`, formattedData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if(response.data.message=="success"){
          toastr.success("Success!");
          check = 1;
        }else{
          toastr.error(response.data.message);
        }        
      }
      if(check==1){
        setEditFormData((prevData) => ({
          ...prevData,
          pricingList: response.data.product,
        }));
        fetchProducts(filterType,filterCategory);
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
      supplierId: null,
      effective_date: null,
    });
    setShowPricingModal(true);
  };

  const handleImageSave = async () => {
    if (!newImageFile || !selectedImageProductId) return;

    const formDataImage = new FormData();
    formDataImage.append('image', newImageFile);
    formDataImage.append('product_id', selectedImageProductId);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/product/update-image`, formDataImage, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setSelectedImage(response.data.image_url);
        setPreviewImage(response.data.image_url);
        setIsImageEditing(false);
        setNewImageFile(null);
        fetchProducts(filterType,filterCategory);
        toastr.success("Success!");
      } else {
        // console.error(response.data.message);
      }
    } catch (error) {
      // console.error('Image update failed:', error);
    }
  };

  const handlePrint = async () => {
    let productsPrint = [];

    try {
      const authToken = localStorage.getItem("token");
      const response = await axios.get(`/api/products/print`, {
        params: {
          search: search,
          filter: filterType,
          filterCategory: filterCategory
        },
        headers: { Authorization: `Bearer ${authToken}` },
      });
      productsPrint = response.data.data;
    } catch (error) {
      // console.log(error);
    }

    const printWindow = window.open('', '', 'height=600,width=800');
    
    if (!printWindow) return;

    const doc = printWindow.document;
        doc.title = "Products - Rockfil Stainless Metal Works"; 
        doc.head.innerHTML += `<title>Products</title>`;
        const body = doc.createElement('body');
    
        // Create styles
        const style = doc.createElement('style');
        style.textContent = `
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { 
                display: flex; 
                align-items: center; 
                justify-content: center;
                border-bottom: 2px solid black; 
                padding-bottom: 10px; 
                gap: 15px;
            }
            .header img { width: 70px; height: auto; }
            .header .middle-logo { margin: 0 0px; }
            .header-text { text-align: left; line-height: 1.2; flex: 1; }
            .header-text h4 { text-align: left; margin: 0; font-size: 18px; }
            .header-text p { margin: 0px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 5px; border: 1px solid #000; text-align: left; font-size: 12px; }
            th { text-align: center; font-size: 14px; }
            h2, h4 { text-align: center; }
            .supplier-date-container { 
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 3px;
                margin-top: 0px;
                align-items: start;
                font-size: 14px;
            }
            .supplier {
                text-align: left;
                margin-bottom: 0px;
                padding-bottom: 0px;
            }
            .date {
                text-align: right;
                align-self: start;
                margin-bottom: 0px;
            }
            .address {
                grid-column: span 2;
                text-align: left; 
                margin-top: 0px;
            }
            .underline {
                display: inline-block;
                border-bottom: 1px solid black;
            }
            .font-medium {
                font-weight: bold;
            }
            .no-border {
                border: none !important;
            }            
            .payment-status {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                margin-top: 5px;
            }
            .payment-status span {
                display: inline-block;
                width: 150px;
                border-bottom: 1px solid black;
            }
            .cheque-receipt {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                margin-top: -15px;
            }
            .cheque-receipt span {
                display: inline-block;
                width: 200px;
                border-bottom: 1px solid black;
            }
            .acknowledgment {
                font-style: italic;
                margin-top: -10px;
                font-size: 12px;
            }
            .signatories {
                display: flex;
                justify-content: space-between; /* Evenly distribute signatures */
                align-items: center;
                margin-top: 30px;
                font-size: 12px;
                gap: 20px; /* Adds spacing between each signature block */
            }

            .signature-block {
                text-align: center;
                flex: 1;
                position: relative;
            }
            .signature-line {
                display: block;
                width: 80%; /* Controls the length of the underline */
                border-top: 1px solid black; /* Creates the underline */
                margin: 0 auto 5px auto; /* Centers the line */
                height: 0px; /* Adds spacing between the line and text */
            }
            .signature-block p {
                margin: 0;
            }
            .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background-color: #f8f9fa;
                text-align: center;
                padding: 10px 0;
                font-size: 12px;
                border-top: 1px solid #ccc;
            }
            .footer p {
                margin: 3px 0;
                font-size: 10px;
            }
        `;
        doc.head.appendChild(style);
    
        const header = doc.createElement('div');
        header.className = 'header';
    
        const leftLogo = doc.createElement('img');
        leftLogo.src = '/images/clstldev2.png'; 
        leftLogo.alt = 'Company Logo';

        const middleLogo = doc.createElement('img');
        middleLogo.src = '/images/rockfil.png';
        middleLogo.alt = 'Company Logo';
        middleLogo.className = 'middle-logo';
    
        const headerText = doc.createElement('div');
        headerText.className = 'header-text';
        headerText.innerHTML = `
            <h4>ROCKFIL STAINLESS METAL WORK DOT SUPPLY CORP.</h4>
            <p>Delgado Bldg., Brgy. 110 Utap, Diversion Rd., Tacloban City</p>
            <p>Telephone No: (053) 888 1003 | Mobile Nos: 0918-903-5706 / 0920-959-5734</p>
            <p>Email: rockfilstainless@gmail.com</p>
        `;
    
        header.appendChild(leftLogo);
        header.appendChild(middleLogo);
        header.appendChild(headerText);
    
        const title = doc.createElement('h4');
        title.innerText = 'Products';

        const table = doc.createElement('table');
    
        const thead = doc.createElement('thead');
        const headerRow = doc.createElement('tr');
        const headers = ['#', 'Code', 'Supplier', 'Image', 'Name', 'Category', 'Cost', 'Price', 'Qty'];
        const columnWidths = {
            '#': '5%',
            'Code': '10%',
            'Supplier': '10%',
            'Image': '15%',
            'Name': '15%',
            'Category': '15%',
            'Cost': '10%',
            'Price': '10%',
            'Qty': '10%'
        };
        headers.forEach(headerText => {
            const th = doc.createElement('th');
            th.innerText = headerText;
            th.style.width = columnWidths[headerText];
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
    
        const tbody = doc.createElement('tbody');
        
        productsPrint?.forEach((product, index) => {
            const row = doc.createElement('tr');
    
            const numberCell = doc.createElement('td');
            numberCell.style.textAlign = 'center';
            numberCell.innerText = index + 1;
            row.appendChild(numberCell);
    
            const codeCell = doc.createElement('td');
            codeCell.innerText = product.code || 'N/A';
            row.appendChild(codeCell);

            const uniqueSuppliers = product.pricing_list_available?.filter(
              (value, idx, self) =>
                idx === self.findIndex((t) => t.supplier?.id === value.supplier?.id)
            );
          
            const suppliersName = uniqueSuppliers
              ?.map((p) => p.supplier?.name || '')
              .join('\n') || '';

            const supplierCell = doc.createElement('td');
            supplierCell.innerText = suppliersName;
            supplierCell.style.whiteSpace = 'pre-line';
            row.appendChild(supplierCell);

            const imageCell = doc.createElement('td');
            const img = document.createElement('img');
            img.src = product.img;
            img.alt = product.name || 'Image';
            img.style.width = '60px'; 
            img.style.height = 'auto';
            img.style.objectFit = 'contain';
            imageCell.style.textAlign = 'center';
            imageCell.appendChild(img);
            row.appendChild(imageCell);
    
            const descriptionCell = doc.createElement('td');
            descriptionCell.innerText = product.name_variant || 'No description';
            row.appendChild(descriptionCell);

            const categoryCell = doc.createElement('td');
            categoryCell.innerText = product.product_category.name || '';
            row.appendChild(categoryCell);
    
            const costCell = doc.createElement('td');
            costCell.style.textAlign = 'right';
            costCell.innerText = product.cost ? `${Number(product.cost).toFixed(2).toLocaleString()}` : '0.00';
            row.appendChild(costCell);
    
            const totalCell = doc.createElement('td');
            totalCell.style.textAlign = 'right';
            totalCell.innerText = product.price ? `${Number(product.price).toFixed(2).toLocaleString()}` : '0.00';
            row.appendChild(totalCell);

            const qtyCell = doc.createElement('td');
            qtyCell.style.textAlign = 'center';
            const qtyValue = product.qty ? (Number(product.qty) % 1 === 0 ? Number(product.qty) : Number(product.qty).toFixed(2)) : '0';
            qtyCell.innerText = qtyValue;
            row.appendChild(qtyCell);
    
            tbody.appendChild(row);
        });

        table.appendChild(tbody);

        body.appendChild(header);
        body.appendChild(title);
        body.appendChild(table);
        doc.body.replaceWith(body);
    
        let imagesLoaded = 0;
        const totalImages = 2; 

        function checkAndPrint() {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                printWindow.document.close();
                printWindow.print();
            }
        }

        leftLogo.onload = checkAndPrint;
        middleLogo.onload = checkAndPrint;

        setTimeout(() => {
            if (imagesLoaded < totalImages) {
                printWindow.document.close();
                printWindow.print();
            }
        }, 3000);
  };

  const fetchSuppliers = async (inputValue) => {
    const authToken = localStorage.getItem("token");
    const response = await axios.get(`/api/fetch-suppliers`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        search: inputValue,
      },
    });
    const data = response.data;
    return data.map((supplier) => ({
      label: supplier.name,
      value: supplier.id,
    }));
  };

  const fetchSuppliersModal = async (inputValue) => {
    const authToken = localStorage.getItem("token");
    const response = await axios.get(`/api/fetch-suppliers`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        search: inputValue,
      },
    });
    const data = response.data;
    return data.map((supplier) => ({
      label: supplier.name,
      value: supplier.id,
    }));
  };

  const handleRemovePricing = (pricing) => {
    Swal.fire({
        title: `Remove?`,
        text: `Are you sure you want to remove this price "${pricing.price}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, remove it!",
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const authToken = localStorage.getItem("token");
                const response = await axios.get("/api/products/pricing/delete", {
                    params: { id: pricing.id },
                    headers: { Authorization: `Bearer ${authToken}` },
                });

                if (response.data.message === 'Price removed successfully.') {
                    // ✅ Update local state
                    const updatedPricingList = editFormData.pricingList.filter(
                        (p) => p.id !== pricing.id
                    );
                    setEditFormData({
                        ...editFormData,
                        pricingList: updatedPricingList,
                    });

                    Swal.fire("Removed!", `Price "${pricing.price}" has been removed.`, "success");
                } else {
                    Swal.fire("Error", response.data.message, "error");
                }
            } catch (error) {
                Swal.fire("Error", "An error occurred while removing the price.", "error");
            }
        }
    });
  };

  const openViewProductSalesModal = (product) => {
    setSelectedProductsSales(product);
    setShowViewProductSalesModal(true);
  };

  const formatPrice = (price) => {
        if (Number(price) === 0) return ' -';
        return `₱${Number(price).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  return (
    <Layout>
      <div className="w-full mt-10 mx-auto">
        {/* Tabs */}
        <div className="mt-15 flex gap-4 mb-4">
          {["lists", "sales"].map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                activeTab === tab
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "lists" &&

        <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-4">  
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

            {/* Damage Stock */}
            {/* <button
              onClick={() => handleFilter("damaged")}
              className={`flex flex-col items-center p-3 rounded-xl shadow-md transition transform hover:scale-105 ${
                filterType === "damaged" ? "bg-red-800 text-white" : "bg-white border border-gray-300"
              }`}
            >
              <ZapOff size={25} className={`${filterType === "damaged" ? "text-white" : "text-red-800"}`} />
              <span className="mt-2 text-base font-semibold">Damaged</span>
              <span className="text-lg font-bold">{summary.damaged}</span>
            </button> */}
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6">
            <div></div>
            <button
              onClick={() => handleFilterCategories(1)}
              className={`flex flex-col items-center p-3 rounded-xl shadow-md transition transform hover:scale-105 ${
                filterCategory === 1 ? "bg-indigo-600 text-white" : "bg-white border border-gray-300"
              }`}
            >
              <Boxes size={28} className={`${filterCategory === 1 ? "text-white" : "text-indigo-600"}`} />
              <span className="mt-2 text-base font-semibold">Main</span>
              <span className="text-lg font-bold">{categoriesCount.main}</span>
            </button>
            <button
              onClick={() => handleFilterCategories(2)}
              className={`flex flex-col items-center p-3 rounded-xl shadow-md transition transform hover:scale-105 ${
                filterCategory === 2 ? "bg-pink-600 text-white" : "bg-white border border-gray-300"
              }`}
            >
              <Puzzle size={28} className={`${filterCategory === 2 ? "text-white" : "text-pink-600"}`} />
              <span className="mt-2 text-base font-semibold">Accessories</span>
              <span className="text-lg font-bold">{categoriesCount.accessories}</span>
            </button>
            <button
              onClick={() => handleFilterCategories(3)}
              className={`flex flex-col items-center p-3 rounded-xl shadow-md transition transform hover:scale-105 ${
                filterCategory === 3 ? "bg-amber-600 text-white" : "bg-white border border-gray-300"
              }`}
            >
              <Bolt size={28} className={`${filterCategory === 3 ? "text-white" : "text-amber-600"}`} />
              <span className="mt-2 text-base font-semibold">Bolts and Screws</span>
              <span className="text-lg font-bold">{categoriesCount.boltsNscrews}</span>
            </button>
            <div></div>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <div className="flex items-center gap-4 mb-6">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={handleSearch}
                className="flex-grow border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* <Select
                options={supplierOptions}
                isMulti
                value={selectedSupplier}
                onChange={(selected) => setSelectedSupplier(selected)}
                className="w-full"
                placeholder="Suppliers..."
              /> */}
              <AsyncSelect
                isMulti
                cacheOptions
                defaultOptions
                loadOptions={fetchSuppliers}
                onChange={(selected) => setSelectedSupplier(selected || [])}
                value={selectedSupplier}
                className="w-full"
                placeholder="Search Suppliers..."
              />
              <button
                onClick={handlePrint}
                className="flex flex-row items-center justify-center p-3 rounded-xl bg-blue-600 text-white shadow-md transition transform hover:scale-105"
              >
                <Printer size={28} />
                <span className="ml-2 text-base font-semibold">Print</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSort("code")}
                  >
                    <div className="flex items-center">
                        <span>Code</span>
                        <span className="ml-1">
                            {sortColumn === "code" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSort("supplier")}
                  >
                    <div className="flex items-center">
                        <span>Supplier</span>
                        <span className="ml-1">
                            {sortColumn === "supplier" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Image</th>
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                        <span>Name</span>
                        <span className="ml-1">
                            {sortColumn === "name" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSort("variant")}
                  >
                    <div className="flex items-center">
                        <span>Variant</span>
                        <span className="ml-1">
                            {sortColumn === "variant" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSort("product_category_id")}
                  >
                    <div className="flex items-center">
                        <span>Category</span>
                        <span className="ml-1">
                            {sortColumn === "product_category_id" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSort("cost")}
                  >
                    <div className="flex items-center">
                        <span>Cost</span>
                        <span className="ml-1">
                            {sortColumn === "cost" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center">
                        <span>Price</span>
                        <span className="ml-1">
                            {sortColumn === "price" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSort("qty")}
                  >
                    <div className="flex items-center">
                        <span>Qty</span>
                        <span className="ml-1">
                            {sortColumn === "qty" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product, index) => (
                    <tr key={product.id}>
                      <td className="border border-gray-300 px-4 py-2">{product.code}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {product.pricing_list_available?.length > 0 ? (
                          <div className="space-y-3">
                            {product.pricing_list_available
                              ?.filter((value, index, self) => 
                                index === self.findIndex((t) => (
                                  t.supplier?.id === value.supplier?.id
                                ))
                              )
                              .map((price, index) => (
                                <div
                                  key={index}
                                  className="p-2 border-b border-gray-200 rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow"
                                >
                                  <p className="text-sm font-semibold text-gray-800">{price.supplier?.name}</p>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No supplier available</p>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 flex justify-center">
                        <img
                          src={product.img}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded cursor-pointer"
                          onClick={() => handleImageClick(product.img,product.id)}
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{product.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{product.variant}</td>
                      <td className="border border-gray-300 px-4 py-2">{product.product_category?.name}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {parseFloat(product.cost)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {parseFloat(product.price)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {parseFloat(product.qty)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
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
                      <label className="block text-sm font-medium text-gray-700">Track Product:</label>
                      <select
                        name="track"
                        value={formData.track}
                        onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                        className={`w-full border px-3 py-2 rounded-lg focus:outline-none ${
                          errors.track ? "border-red-500" : "border-gray-300"
                        }`}
                        wrapperClassName={`w-full ${
                          errors.track ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        <option value="Y">Yes</option>
                        <option value="N">No</option>
                      </select>
                    </div>
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
                    {formData.track !== 'N' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier</label>
                      <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={fetchSuppliersModal}
                        onChange={(selected) => setFormData({ ...formData, supplierId: selected })}
                        value={formData.supplierId}
                        className="w-full"
                        placeholder="Search Suppliers..."
                      />
                    </div>
                    )}
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {editFormData.track !== 'N' && (
                      <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <input
                            type="checkbox"
                            name="phaseOut"
                            checked={editFormData.product_status === "Phaseout"}
                            onChange={(e) => {
                              setEditFormData({
                                ...editFormData,
                                product_status: e.target.checked ? "Phaseout" : "Available",
                              });
                            }}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span>PhaseOut?</span>
                        </label>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Track Product:</label>
                      <select
                        name="track"
                        value={editFormData.track}
                        onChange={(e) => setEditFormData({ ...editFormData, track: e.target.value })}
                        className={`w-full border px-3 py-2 rounded-lg focus:outline-none ${
                          editErrors.track ? "border-red-500" : "border-gray-300"
                        }`}
                        wrapperClassName={`w-full ${
                          editErrors.track ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        <option value="Y">Yes</option>
                        <option value="N">No</option>
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
                        {editFormData.track !== 'N' && (
                          <button
                            type="button"
                            onClick={() => openNewPricingModal(editFormData.id)}
                            className="bg-green-600 text-white text-sm px-3 py-1 rounded-md hover:bg-green-700 transition"
                          >
                            New Pricing
                          </button>
                        )}
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
                              <p className="text-sm text-gray-500">Supplier: {pricing.supplier?.name}</p>
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
                            {pricing.qty<=0 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePricing(pricing)}
                                className="mt-2 bg-red-500 text-white text-sm py-1 px-2 rounded-md hover:bg-red-600 transition"
                              >
                                Delete
                              </button>
                            )}
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
    
                {/* Supplier */}
                {editFormData.track !== "N" && ( <>
                  <label className="block mb-2 mt-3">Supplier:</label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={fetchSuppliersModal}
                    onChange={(selected) => setSelectedPricing({ ...selectedPricing, supplierId: selected })}
                    value={selectedPricing.supplierId}
                    className="w-full"
                    placeholder="Search Suppliers..."
                  /> </>
                )}
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
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Product Image</h2>
    
              <img
                src={previewImage}
                alt="Product Preview"
                className="w-full max-h-[70vh] object-contain border rounded mb-4"
              />
    
              {isImageEditing && (
                <div className="mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full border p-2 rounded"
                  />
                </div>
              )}
    
              <div className="flex justify-end space-x-2">
                {!isImageEditing ? (
                  <button
                    onClick={handleImageEditClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit Image
                  </button>
                ) : (
                  <button
                    onClick={handleImageSave}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                )}
                <button
                  onClick={handleImageClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          
          )}

        </div>
        }

        {activeTab === "sales" &&

        <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-4">  
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Products Sales</h1>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Search Input */}
            <input
                type="text"
                placeholder="Search products sales..."
                value={searchProductsSales}
                onChange={handleSearchProductsSales}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Single Calendar for Date Range */}
            <DatePicker
                selected={startDate}
                onChange={(update) => setDateRange(update)}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                isClearable
                placeholderText="Select duration"
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Products Sales Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSortProductsSales("code")}
                  >
                    <div className="flex items-center">
                        <span>Code</span>
                        <span className="ml-1">
                            {sortColumnProductsSales === "code" ? (sortOrderProductsSales === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Image</th>
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSortProductsSales("name_variant")}
                  >
                    <div className="flex items-center">
                        <span>Product</span>
                        <span className="ml-1">
                            {sortColumnProductsSales === "name_variant" ? (sortOrderProductsSales === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSortProductsSales("product_category_id")}
                  >
                    <div className="flex items-center">
                        <span>Category</span>
                        <span className="ml-1">
                            {sortColumnProductsSales === "product_category_id" ? (sortOrderProductsSales === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSortProductsSales("total_costs")}
                  >
                    <div className="flex items-center">
                        <span>Cost</span>
                        <span className="ml-1">
                            {sortColumnProductsSales === "total_costs" ? (sortOrderProductsSales === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSortProductsSales("total_amount")}
                  >
                    <div className="flex items-center">
                        <span>Amount</span>
                        <span className="ml-1">
                            {sortColumnProductsSales === "total_amount" ? (sortOrderProductsSales === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                    onClick={() => handleSortProductsSales("total_qty")}
                  >
                    <div className="flex items-center">
                        <span>Qty</span>
                        <span className="ml-1">
                            {sortColumnProductsSales === "total_qty" ? (sortOrderProductsSales === "asc" ? "🔼" : "🔽") : "↕️"}
                        </span>
                    </div>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productsSales.length > 0 ? (
                  productsSales.map((product, index) => (
                    <tr key={product.id}>
                      <td className="border border-gray-300 px-4 py-2">{product.code}</td>                      
                      <td className="border border-gray-300 px-4 py-2 flex justify-center">
                        <img
                          src={product.img}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                          // onClick={() => handleImageClick(product.img,product.id)}
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{product.name_variant}</td>
                      <td className="border border-gray-300 px-4 py-2">{product.product_category?.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{product.total_costs}</td>
                      <td className="border border-gray-300 px-4 py-2">{product.total_amount}</td>
                      <td className="border border-gray-300 px-4 py-2">{product.total_qty}</td>
                      <td className="border border-gray-300 px-4 py-2 gap-2">
                        <button onClick={() => openViewProductSalesModal(product)}
                          className="flex items-center gap-1 text-blue-600 hover:underline">
                          <View size={16} /> View
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
          {metaProductsSales && (
            <div className="flex justify-between items-center mt-4">
              <button
                disabled={!metaProductsSales.prev}
                onClick={() => setPageProductsSales(pageProductsSales - 1)}
                className={`px-4 py-2 rounded-lg ${metaProductsSales.prev ? "text-white bg-blue-600 hover:bg-blue-500" : "bg-gray-200 cursor-not-allowed"}`}
              >
                Previous
              </button>
              <span>
                Page {metaProductsSales.current_page} of {metaProductsSales.last_page}
              </span>
              <button
                disabled={!metaProductsSales.next}
                onClick={() => setPageProductsSales(pageProductsSales + 1)}
                className={`px-4 py-2 rounded-lg ${metaProductsSales.next ? "text-white bg-blue-600 hover:bg-blue-500" : "bg-gray-200 cursor-not-allowed"}`}
              >
                Next
              </button>
            </div>
          )}

          {showViewProductSalesModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-3xl">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedProductsSales.name_variant}
                </h3>

                <div className="mt-2">
                  <div>
                      <label>Total Cost: </label>
                      <span className="text-blue-600">
                          {formatPrice(selectedProductsSales.total_costs)}
                      </span>
                  </div>
                  <div>
                      <label>Total Quantity: </label>
                      <span className="text-purple-600">
                        {selectedProductsSales.total_qty}
                      </span>
                  </div>
                  <div>
                      <label>Total Quantity: </label> 
                      <span className="text-green-600">
                          {formatPrice(selectedProductsSales.total_amount)}
                      </span>
                  </div>
                </div>

                <div className="overflow-x-auto mt-4">
                  <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                          <tr className="bg-gray-100 text-gray-700">
                              <th className="border border-gray-300 px-4 py-2 text-left">DateTime of Sale</th>
                              <th className="border border-gray-300 px-4 py-2 text-left">Cost</th>
                              <th className="border border-gray-300 px-4 py-2 text-left">Price</th>
                              <th className="border border-gray-300 px-4 py-2 text-left">Qty</th>
                              <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                          </tr>
                      </thead>
                      <tbody>
                        {selectedProductsSales?.sales?.length > 0 ? (
                          selectedProductsSales.sales.map((sale, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2">
                                {new Date(sale.sale_info?.date_time_of_sale).toLocaleString()}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {formatPrice(sale.cost)}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {formatPrice(sale.price)}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {sale.qty}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {formatPrice(sale.amount)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-4 text-gray-500">
                              No sales data available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowViewProductSalesModal(false)} className="text-gray-600">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        }
      </div>
    </Layout>
  );
};

export default Products;
