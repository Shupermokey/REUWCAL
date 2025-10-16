import React from "react";
import Register from "../features/auth/Auth/Register";
import { useNavigate } from "react-router-dom";

//CSS
import "@styles/components/RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();

  return (
    <>
      <Register />
      <button onClick={() => navigate("/")}>Back</button>
    </>
  );
}

export default RegisterPage;
