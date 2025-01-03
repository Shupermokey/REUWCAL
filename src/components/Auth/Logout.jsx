import React from "react";
import { logoutUser } from "../../firebase/authService";

const Logout = () => {
  const handleLogout = async () => {
    try {
      await logoutUser();
      console.log("User logged out");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default Logout;
