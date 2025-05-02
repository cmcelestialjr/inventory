import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { LogInIcon } from 'lucide-react';
import axios from 'axios';
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: false, password: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (token) {
      if(userRole=="2"){
        navigate('/pos');
      }else{
        navigate('/dashboard');
      }      
    }
  }, [navigate]);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (e.target.value) setErrors((prev) => ({ ...prev, username: false }));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (e.target.value) setErrors((prev) => ({ ...prev, password: false }));
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validate the inputs
    const newErrors = {
      username: username.trim() === '',
      password: password.trim() === '',
    };

    setErrors(newErrors);
    
    if (!newErrors.username && !newErrors.password) {
      setLoading(true);
        try {
          
          const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

          const response = 
            await axios.post('/api/login', {
                username,
                password,
              },
              {
                headers: {
                  'X-CSRF-TOKEN': csrfToken,
                },
              }
            );

            if(response.data.message=="success"){
              localStorage.removeItem("token");
              localStorage.removeItem("userRole");
              localStorage.setItem('token', response.data.token);
              localStorage.setItem('userRole', response.data.userRole);
              toastr.success('Login successful!');
              if(response.data.userRole===2){
                navigate('/pos', { replace: true });
              }else{
                navigate('/dashboard', { replace: true });
              }
              
            }else{
              toastr.error(response.data.message);
            }
      
            
        } catch (error) {
          toastr.error('An unexpected error occurred. Please try again later.');
        } finally {
          setLoading(false);
        }
    }else{
      toastr.warning('Please fill in both fields.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4">
            <img src="/images/clstldev2.png" alt="Logo 1" className="w-32" />
            <img src="/images/rockfil.png" alt="Logo 2" className="w-32" />
          </div>
          <h1 className="text-2xl font-bold mt-4">Inventory System</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                errors.username ? 'border-red-500' : 'focus:ring-2 focus:ring-blue-400'
              }`}
              placeholder="Username"
              value={username}
              onChange={handleUsernameChange}              
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                errors.password ? 'border-red-500' : 'focus:ring-2 focus:ring-blue-400'
              }`}
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}              
            />  
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute top-2/4 right-3 transform -translate-y-2/4 focus:outline-none"
            >
              {showPassword ? <EyeIcon className="h-5 w-5" /> : <EyeOffIcon className="h-5 w-5" />}
            </button>
          </div>
          <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center justify-center space-x-2"
              disabled={loading}
            >              
              {loading ? (
                <div className="w-5 h-5 border-4 border-t-4 border-white border-solid rounded-full animate-spin"></div> // Loader
              ) : (
                <LogInIcon className="h-5 w-5" />
              )}              
              <span>{loading ? 'Logging in...' : 'Login'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
