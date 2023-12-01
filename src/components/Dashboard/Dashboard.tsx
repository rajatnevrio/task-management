import React, { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/signin");
    } catch (error) {
      console.error("Error during logout", error);
    }
  }

  console.log('firsteq', currentUser);

  useEffect(() => {
    if (!currentUser) {
      // Redirect to sign-in if user is not logged in
      navigate("/signin");
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    // Render loading spinner or message while redirecting
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-6xl font-semibold">Profile</h1>
      <h3 className="text-2xl ">Email: {currentUser?.email}</h3>
      <p onClick={() => handleLogout()}>Log Out</p>
    </div>
  );
};

export default Dashboard;
