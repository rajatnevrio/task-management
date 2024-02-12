import React, { useState } from "react";
import SideBar from "../SideBar";
import { useAuth } from "../../contexts/AuthContext";
import ChangePassword from "../Auth/ChangePassword";
import Employees from "../Employees/Employees";

function Profile() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false);
  return (
    <div className="flex flex-col w-full m-8 gap-y-4">
      <h1 className="text-4xl font-bold pb-2 text-gray-800">Profile</h1>

      {modal ? (
        <div className="h-56">
          {" "}
          <ChangePassword
            loading={loading}
            setLoading={setLoading}
            setModal={setModal}
          />
          <span
            className="underline text-blue-500 cursor-pointer   text-lg font-semibold"
            onClick={() => setModal(!modal)}
          >
            {" "}
            Back{" "}
          </span>
        </div>
      ) : (
        <div className="bg-white p-6 sm:max-w-[360px] rounded-lg shadow-md">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 py-3">Name</h3>
            <p className="text-xl text-gray-900">{currentUser?.displayName}</p>
          </div>
          <hr className="my-2 border-t border-gray-300" />
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 py-3">Email</h3>
            <p className="text-xl text-gray-900">{currentUser?.email}</p>
          </div>
          <hr className="my-2 border-t border-gray-300" />
          <div>
            <h3 className="text-lg font-semibold text-gray-700 py-3">Role</h3>
            <p className="text-xl text-gray-900">{currentUser?.role}</p>
          </div>
        </div>
      )}
      {/* {!modal && (
        <span
          className="underline text-blue-500 cursor-pointer  mt-6 text-lg font-semibold"
          onClick={() => setModal(!modal)}
        >
          {" "}
          {loading ? "Loading..." : "Change Password"}{" "}
        </span>
      )} */}
      
           {!modal&&(<button
        type="submit"
        disabled={loading}
        onClick={() => setModal(!modal)}
        className={`flex w-fit justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm ${
          loading ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-500"
        } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
      >
        {loading ? "Loading..." : "Change Password"}
      </button>)}
      <Employees type ={'admin'} />
    </div>
  );
}

export default Profile;
