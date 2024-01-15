import React from "react";
import SideBar from "../SideBar";
import { useAuth } from "../../contexts/AuthContext";

function Profile() {
  const { currentUser } = useAuth();

  return (
    <div className="flex flex-col w-full m-8 gap-y-4">
      <h1 className="text-4xl font-bold pb-2 text-gray-800">Profile</h1>
      <div className="bg-white p-6 w-fit rounded-lg shadow-md">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Name</h3>
          <p className="text-xl text-gray-900">{currentUser?.displayName}</p>
        </div>
        <hr className="my-2 border-t border-gray-300" />
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Email</h3>
          <p className="text-xl text-gray-900">{currentUser?.email}</p>
        </div>
        <hr className="my-2 border-t border-gray-300" />
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Role</h3>
          <p className="text-xl text-gray-900">{currentUser?.role}</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
