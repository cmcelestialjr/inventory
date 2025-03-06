import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Plus, Trash, CreditCard, CheckCircle, X, LogOut } from "lucide-react";

const PointOfSale = () => {
  const [searchProduct, setSearchProduct] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  const [showDropdownProducts, setShowDropdownProducts] = useState(false);
  const [products, setProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [price, setPrice] = useState(0.00);
  const [priceOptions, setPriceOptions] = useState([]);
  const [cost, setCost] = useState(0.00);
  const [totalCostProduct, setTotalCostProduct] = useState(0.00);
  const [amount, setAmount] = useState(0.00);
  const [discount, setDiscount] = useState(0.00);
  const [productId, setProductId] = useState(null);
  const [productName, setProductName] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0.00);

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

  const handlePriceChange = (e) => {
    const selectedPriceValue = parseFloat(e.target.value); 

    const selected = priceOptions.find(p => p.id === selectedPriceValue);

    if (selected) {
        setSelectedPrice(selected.id);
        setPrice(selected.price); 
        setCost(selected.cost);
        setDiscount(selected.discount); 
    }
  };

  const handleAddProduct = () => {
    if(productId==null){
        toastr.warning("No product selected!");
        return;
    } 

    const newProduct = {
        id: productId,
        name: productName,
        totalCost: totalCostProduct,
        cost: cost,
        price: price,
        discount: discount,
        quantity: quantity,
        amount: amount,
    };

    setProducts((prevProducts) => [...prevProducts, newProduct]);
    setQuantity(1);
    setSearchProduct("");
    setProductName("");
    setProductId("");
    setSelectedPrice(null);
    setPriceOptions([]);
    setCost(0.00);
    setTotalCostProduct(0.00);
    setPrice(0.00);
    setDiscount(0);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:flex md:gap-6 mt-10 mb-10 px-10">

      {/* Right Section - Search & Add Product */}
      <div className="md:w-1/3 bg-white p-4 shadow-lg rounded-lg">
        <div className="relative mb-2">
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
            {showDropdownProducts && productOptions.length > 0 && (
              <ul className="absolute left-0 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                {productOptions.map((product) => (
                  <li 
                    key={product.id} 
                    className="p-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSelectProduct(product)}
                  >
                    {product.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Price, Discount, Quantity, Amount & Add Button */}
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
                  data-c={priceOption.cost}
                  data-d={priceOption.discount}>
                  {priceOption.price} (Qty: {priceOption.qty})
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Qty:</label>
            <input 
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="border px-3 py-2 rounded-lg w-full"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Disc:</label>
            <input 
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
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
        <div className="bg-white p-3 shadow-lg rounded-lg mt-1 text-sm">
          <button 
            onClick={handleAddProduct} 
            className="mt-3 w-full bg-blue-900 text-white p-2 rounded hover:bg-blue-700 text-sm">
            Add to Checkout
          </button>
        </div>

        {/* Summary Section */}
        <div className="bg-white p-3 shadow-lg rounded-lg mt-4 text-sm">
          <h2 className="text-md font-bold mb-2">Summary</h2>
          <div className="space-y-1">
            <p className="flex justify-between"><span>Subtotal:</span> <span>{totalAmount}</span></p>
            <p className="flex justify-between"><span>Discount:</span> <span>0.00</span></p>
            <p className="flex justify-between font-semibold"><span>Total:</span> <span>{totalAmount}</span></p>
          </div>
          <button className="mt-3 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 text-sm">Proceed to Payment</button>
        </div>
        {/* <div className="mt-6 border-t pt-4">
          <h2 className="font-bold mb-2">Payment Options</h2>
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-green-500 text-white p-2 rounded hover:bg-green-600">Cash</button>
            <button className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Gcash</button>
            <button className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600">Debt</button>
            <button className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">Others</button>
          </div>
        </div> */}
      </div>

      {/* Middle Section - Products */}
      <div className="md:w-2/3 bg-white p-4 shadow-lg rounded-lg mt-4 md:mt-0 flex flex-col">
        <h2 className="text-lg font-bold mb-2">Checkout</h2>
        <div className="space-y-2 flex-1 overflow-y-auto border p-2 rounded-md">
        <p className="text-gray-500">No items to checkout.</p>
          {/* {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-2 border rounded-md">
              <div>
                <p>{item.name}</p>
                <p className="text-sm text-gray-500">${item.price} x {item.quantity}</p>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                <Trash size={18} />
              </button>
            </div>
          ))}
          {cart.length === 0 && <p className="text-gray-500">No items to checkout.</p>} */}
        </div>
      </div>
    </div>
  );
};

export default PointOfSale;
