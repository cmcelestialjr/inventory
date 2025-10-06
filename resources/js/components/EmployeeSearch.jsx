import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

const EmployeeSearch = ({ onEmployeeSelect, employeeID }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ✅ Ref to skip search after selecting employee
  const justSelectedRef = useRef(false);

  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (query.length < 1) {
        setSuggestions([]);
        return;
      }
      try {
        const authToken = localStorage.getItem('token');
        const response = await axios.get(`/api/employees/search`, {
          params: { search: query },
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setSuggestions(response.data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching employee suggestions:', error);
        setSuggestions([]);
      }
    }, 300),
    []
  );

  useEffect(() => {
    // ✅ Skip fetching if a selection was just made
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    if (searchTerm) {
      fetchSuggestions(searchTerm);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, fetchSuggestions]);

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSuggestionClick = (employee) => {
    const extName = employee.extname ? ` ${employee.extname}` : '';
    const mi = employee.middlename ? ` ${employee.middlename.charAt(0)}.` : '';
    const displayName = `${employee.employee_no || ''} ${employee.lastname}, ${employee.firstname}${extName}${mi}`;

    justSelectedRef.current = true; // ✅ Prevent immediate re-search
    setSearchTerm(displayName);
    setShowSuggestions(false);
    onEmployeeSelect(employee);
  };

  useEffect(() => {
    if (!employeeID) {
      setSearchTerm('');
    }
  }, [employeeID]);

  return (
    <div className="relative w-full">
      <input
        id="employee"
        type="text"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 50)}
      />

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((employee) => (
            <li
              key={employee.id}
              className="p-3 cursor-pointer hover:bg-blue-50 transition duration-150 ease-in-out border-b border-gray-100"
              onMouseDown={() => handleSuggestionClick(employee)}
            >
              <p className="font-semibold text-gray-800">
                {employee.lastname}, {employee.firstname}
                {employee.extname && <span className="text-sm ml-1 text-gray-500">({employee.extname})</span>}
                {employee.middlename && <span className="ml-3">{employee.middlename.charAt(0)}.</span>}
              </p>
              <p className="text-sm text-gray-500">ID: {employee.employee_no}</p>
            </li>
          ))}
        </ul>
      )}

      {/* ✅ Only show "No employees found" if user is actually typing, not after selection */}
      {searchTerm.length >= 2 && showSuggestions && suggestions.length === 0 && !justSelectedRef.current && (
        <div className="absolute z-10 w-full mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-xl text-gray-500 text-sm">
          No employees found.
        </div>
      )}
    </div>
  );
};

export default EmployeeSearch;
