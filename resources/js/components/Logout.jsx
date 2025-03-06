import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");

    navigate("/", { replace: true });
  }, [navigate]);

  return null;
};

export default Logout;
