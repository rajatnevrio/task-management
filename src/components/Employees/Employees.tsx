import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import AddTaskDrawer from "../AddTaskDrawer";
import LoaderComp from "../Loader";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { AddModalState, UserDetails } from "../../types";
import EmployeesTable from "../EmployeesTable";
import AddEmployee from "../AddEmployee";
import axios from "axios";
interface rolesApi {
  email: string;
  name: string;
  role: string;
  displayName: string;
  uid: string;
}
interface EmployeeProps {
  type?: string;
}
function Employees({ type }: EmployeeProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [modalState, setModalState] = useState<AddModalState>({
    isOpen: false,
    details: {
      displayName: "",
      uid: "",
      email: "",
      // Add other properties as needed
    },
  });
  const [list, setList] = useState<rolesApi[]>([]);


  const navigate = useNavigate();
  const updateData = () => {
    getData()
  };

  const getData = async () => {
    setLoading(true)

    try {
      // Replace the API call with the getAllUsers API using Axios
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/getUsersByRole/${type? `task-creator`:`employee`}`
      );

      const users = response.data;
      setLoading(false)

      setList(users);
    } catch (error: any) {
      setLoading(false)

      console.error("Error fetching user data:", error.message);
      // Handle error accordingly, e.g., show an error message to the user
    }
  };


  useEffect(() => {
    getData();

    if (!currentUser) {
      navigate("/signin");
    } else {
    }
  }, [type]);

  if (!currentUser) {
    return <LoaderComp />;
  }

  return (
    <div className="flex w-full">
      {loading ? (
        <div className="w-full justify-center items-center flex">
          <LoaderComp />
        </div>
      ) : (
        <div className="m-8  w-full flex flex-col">
          <div className="flex w-full justify-between ">
            <span className=" flex items-center justify-center text-4xl font-semibold">
              {type ? `Intake Team` : `Employees`}
            </span>
            {currentUser.role === "admin" && (
              <button
                title={type ? `Add Intake` : `Add Employee`}
                onClick={() => {
                  setModalState((prev) => ({
                    ...prev,
                    isOpen: !modalState.isOpen,
                  }));
                }}
                className="h-12 my-4 mr-16 p-2 rounded-lg text-white w-fit bg-blue-500"
              >
                {type ? `Add Intake` : `Add Employee`}
              </button>
            )}
          </div>
          <div className=" overflow-y-auto">
            <EmployeesTable
            list={list}
              modalState={modalState}
              setModalState={setModalState}
              updateTaskData={updateData}
              type={type}
            />
          </div>
          {modalState.isOpen && (
            <AddEmployee
              modalState={modalState}
              setModalState={setModalState}
              updateTaskData={updateData}
              type={type}
            />
          )}
        </div>
      )}
      <div></div>
    </div>
  );
}

export default Employees;
