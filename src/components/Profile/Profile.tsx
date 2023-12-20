import React, { useEffect, useState } from "react";
import SideBar from "../SideBar";
import { useAuth } from "../../contexts/AuthContext";

function Profile() {
  const { currentUser} = useAuth();
 
  return (
    <div className="flex">
      <div>
        <h1 className="text-6xl font-semibold">Profile</h1>
        <h3 className="text-2xl ">Name: {currentUser?.displayName}</h3>
        <h3 className="text-2xl ">Email: {currentUser?.email}</h3>
        <h3 className="text-2xl ">Role: {currentUser?.role}</h3>
      </div>
    </div>
  );
}

export default Profile;
