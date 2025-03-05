
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Returns from './components/Returns';
import Expenses from './components/Expenses';
import Logout from './components/Logout';

function RouterApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>} 
        />
        <Route path="/sales" 
          element={
            <ProtectedRoute>
              <Sales />
            </ProtectedRoute>} 
        />
        <Route path="/returns" 
          element={
            <ProtectedRoute>
              <Returns />
            </ProtectedRoute>} 
        />
        <Route path="/products" 
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>} 
        />
        <Route path="/expenses" 
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>} 
        />
        <Route path="/logout" 
          element={
            <ProtectedRoute>
              <Logout />
            </ProtectedRoute>} 
        />
      </Routes>
    </Router>
  );
}

export default RouterApp;