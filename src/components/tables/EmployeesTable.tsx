import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTable, Column } from "react-table";
import axios from "axios";

import {
  TrashIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import {
  collection,
  doc,
  deleteDoc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../contexts/AuthContext";
import ConfirmModal from "../modals/ConfirmModal";
import { toast } from "react-toastify";
import { AddModalState, Employee } from "../../types";

interface rolesApi {
  email: string;
  name: string;
  role: string;
  displayName: string;
  uid: string;
}
interface EmployeeTableProps {
  list: Employee[];
  modalState: AddModalState;
  setModalState: Dispatch<SetStateAction<AddModalState>>;
  updateTaskData: () => void;
  type?: string;
}
interface ModalState {
  isOpen: boolean;
  uid: string;
}

const EmployeesTable: React.FC<EmployeeTableProps> = ({
  list,
  modalState,
  setModalState,
  updateTaskData,
  type,
}) => {
  const { currentUser } = useAuth();

  const [confirmModal, setConfirmModal] = useState<ModalState>({
    isOpen: false,
    uid: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const handleDelete = async (emailId: string) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/deleteUser/${emailId}`
      );

      // Check if the request was successful (status code 2xx)
      if (response.status === 200) {
        setLoading(false);
        toast.success("User Deleted Successfully");
        updateTaskData();
      } else {
        // Handle errors based on the response status
        setLoading(false);
        console.error("Error deleting user:", response.data);
        toast.error("Failed to delete user");
      }
    } catch (error: any) {
      console.error("Error deleting user:", error.message);
      setLoading(false);
      toast.error("Failed to delete user");
    }
  };

  const tableRows = list.map((element, index) => {
    return (
      <tr className="items text-md text-center">
        <td className="px-3 py-4 whitespace-nowrap border-r">{index + 1}</td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {element.displayName}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {element.email}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r text-sm flex">
          {" "}
          {currentUser.role === "admin" && (
            <TrashIcon
              title="Delete task"
              style={{
                height: "30px",
                width: "30px",
                cursor: "pointer",
                color: "red",
              }}
              className="hover:scale-125 rounded-full p-1"
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  uid: element.uid,
                })
              }
            />
          )}
          <PencilSquareIcon
            title="Edit task"
            style={{
              height: "30px",
              width: "30px",
              cursor: "pointer",
              color: "blue",
            }}
            className="hover:scale-125 rounded-full p-1"
            onClick={() =>
              setModalState((prevSidebarState) => ({
                ...prevSidebarState,
                isOpen: true,
                details: element,
              }))
            }
          />
        </td>
      </tr>
    );
  });
  const tableHeaders: string[] = [
    "S.No.",
    "Name",
    "Email",
    // "Instructions",
    "actions",
  ];

  return (
    <>
      <table className="-my-2 overflow-x-auto border  mx-4 sm:m-8 lg:mx-1 overflowY-auto">
        <thead>
          <tr className="border  rounded p-2 bg-gray-200">
            {tableHeaders.map((header, index) => (
              <th
                key={index}
                className="px-2 py-2 border-r-2 border-gray-300 text-center text-md font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">{tableRows}</tbody>
      </table>
      {confirmModal.isOpen && (
        <ConfirmModal
          message="Are you sure you want to delete this employee?"
          confirmButton="Delete"
          onConfirm={() => {
            handleDelete(confirmModal.uid);
            setConfirmModal({ isOpen: false, uid: "" });
          }}
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, uid: "" })}
          isLoading={loading}
        />
      )}
    </>
  );
};

export default EmployeesTable;
