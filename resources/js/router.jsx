
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Sales from './components/Sales';
import ServiceTransactions from './components/ServiceTransactions';
import Returns from './components/Returns';
import Expenses from './components/Expenses';
import PurchaseOrders from './components/PurchaseOrders';
import Products from './components/Products';
import Services from './components/Services';
import Suppliers from './components/Suppliers';
import UsersList from './components/UsersList';
import PointOfSale from './components/PointOfSale';
import Logout from './components/Logout';

function RouterApp() {  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <Dashboard />
            </ProtectedRoute>} 
        />
        <Route path="/sales" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <Sales />
            </ProtectedRoute>} 
        />
        <Route path="/serviceTransactions" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <ServiceTransactions />
            </ProtectedRoute>} 
        />
        <Route path="/returns" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <Returns />
            </ProtectedRoute>} 
        />
        <Route path="/expenses" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <Expenses />
            </ProtectedRoute>} 
        />
        <Route path="/purchase-orders" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <PurchaseOrders />
            </ProtectedRoute>} 
        />
        <Route path="/products" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <Products />
            </ProtectedRoute>} 
        />
        <Route path="/services" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <Services />
            </ProtectedRoute>} 
        />
        <Route path="/suppliers" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <Suppliers />
            </ProtectedRoute>} 
        />
        <Route path="/users" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <UsersList />
            </ProtectedRoute>} 
        />
        <Route path="/pos" 
          element={
            <ProtectedRoute allowedRoles={["2"]}>
              <PointOfSale />
            </ProtectedRoute>} 
        />

        <Route path="/logout" 
          element={
            <ProtectedRoute allowedRoles={["1","2"]}>
              <Logout />
            </ProtectedRoute>} 
        />
      </Routes>
    </Router>
  );
}

export default RouterApp;