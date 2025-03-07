
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Returns from './components/Returns';
import Expenses from './components/Expenses';
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
        <Route path="/returns" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <Returns />
            </ProtectedRoute>} 
        />
        <Route path="/products" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <Products />
            </ProtectedRoute>} 
        />
        <Route path="/expenses" 
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <Expenses />
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