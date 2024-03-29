import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import AddTaskDrawer from "../modals/AddTaskDrawer";
import LoaderComp from "../Loader";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { AddModalState, UserDetails } from "../../types";
import EmployeesTable from "../tables/EmployeesTable";
import AddEmployee from "../modals/AddEmployee";
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
type TypeLabels = {
  [key: string]: {
    default: string;
    title: string;
    button: string;
  };
};
export const typeLabels: TypeLabels = {
  task_creator: {
    default: "task-creator",
    title: "Intake Team",
    button: "Intake",
  },
  employee: {
    default: "employee",
    title: "Employees",
    button: "Employee",
  },
  admin: {
    default: "admin",
    title: "Admins",
    button: "Admin",
  },
};
export const getTypeLabel = (type: string, context = "default"): string => {
  const label = typeLabels[type];
  if (typeof label === "object") {
    return label[context as keyof typeof label] || label.default;
  }
  return label || "Unknown";
};
function Employees({ type }: EmployeeProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [modalState, setModalState] = useState<AddModalState>({
    isOpen: false,
    details: {
      displayName: "",
      uid: "",
      email: "",
      role:""
    },
  });
  const [list, setList] = useState<rolesApi[]>([]);

  const navigate = useNavigate();
  const updateData = () => {
    getData();
  };

  const getData = async () => {
    setLoading(true);
    try {
      // Replace the API call with the getAllUsers API using Axios
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/getUsersByRole/${
          type && getTypeLabel(type, "default")
        }`
      );

      const users = response.data;
      setLoading(false);

      setList(users);
    } catch (error: any) {
      setLoading(false);

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
        <div
          className={`${type !== "admin" ? "m-8" : ""}  w-full flex flex-col`}
        >
          <div className="flex w-full justify-between ">
            <span className=" flex items-center justify-center text-4xl font-semibold">
              {type && getTypeLabel(type, "title")}
            </span>
            {currentUser.role === "admin" && (
              <button
                title={type && getTypeLabel(type, "button")}
                onClick={() => {
                  setModalState((prev) => ({
                    ...prev,
                    isOpen: !modalState.isOpen,
                  }));
                }}
                className="h-12 my-4 mr-16 p-2 rounded-lg text-white w-fit bg-blue-500"
              >
                Add {type && getTypeLabel(type, "button")}
              </button>
            )}
          </div>

          <div className=" overflow-y-auto">
            {list.length > 0 ? (
              <EmployeesTable
                list={list}
                modalState={modalState}
                setModalState={setModalState}
                updateTaskData={updateData}
                type={type}
              />
            ) : (
              <p className="flex text-xl justify-center items-center h-[300px]">
                No {type && getTypeLabel(type, "button")} found
              </p>
            )}
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
