// TaskTable.tsx
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTable, Column } from "react-table";
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
import { db } from "../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "./ConfirmModal";
import { toast } from "react-toastify";

interface rolesApi {
  email: string;
  name: string;
  role: string;
}
interface TaskTableProps {
  updateTaskData: () => void;
}
interface ModalState {
  isOpen: boolean;
  email: string;
}

const EmployeesTable: React.FC<TaskTableProps> = ({
  updateTaskData,
}) => {
  const [list, setList] = useState<rolesApi[]>([]);

  const { currentUser, getUserRoles } = useAuth();

  const [confirmModal, setConfirmModal] = useState<ModalState>({
    isOpen: false,
    email: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const handleDelete = async (emailId: string) => {
    setLoading(true);
    try {
      // Form a reference to the collection
      const userRolesCollectionRef = collection(db, "userRoles");

      // Create a query to find the document with the specified email
      const q = query(userRolesCollectionRef, where("email", "==", emailId));

      // Execute the query
      const querySnapshot = await getDocs(q);

      // Check if there is a matching document
      if (querySnapshot.size === 0) {
        // No matching document found
        setLoading(false);
        toast.error("Task not found");
        return;
      }

      // Since there should be only one matching document, get the first document reference
      const taskDocRef = doc(db, "userRoles", querySnapshot.docs[0].id);

      // Delete the document
      await deleteDoc(taskDocRef);

      setLoading(false);
      toast.success("Task Deleted Successfully");
      updateTaskData();
    } catch (error) {
      console.error("Error deleting document:", error);
      setLoading(false);
      toast.error("Failed to delete task");
    }
  };
  const getData = async () => {
    const val = await getUserRoles();
    console.log("first12", val);
    setList(val);
  };
  useEffect(() => {
    getData();
  }, []);
  const tableRows = list.map((element, index) => {
    return (
      <tr className="items text-md text-center">
        <td className="px-3 py-4 whitespace-nowrap border-r">{index + 1}</td>
        <td className="px-3 py-4 whitespace-nowrap border-r">{element.name}</td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {element.email}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r text-sm flex">
          {" "}
          {currentUser.role === "admin" && (
            <TrashIcon
              title="Delete task"
              style={{ height: "30px", width: "30px", cursor: "pointer" }}
              className="hover:bg-red-500 rounded-full p-1"
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  email: element.email,
                })
              }
            />
          )}
          <PencilSquareIcon
            title="Edit task"
            style={{ height: "30px", width: "30px", cursor: "pointer" }}
            className="hover:bg-green-500 rounded-full p-1"
            // onClick={() =>
            //   setSidebarOpen((prevSidebarState) => ({
            //     ...prevSidebarState,
            //     isOpen: true,
            //     id: element?.docId?.toString(), // Ensure id is treated as a string
            //   }))
            // }
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
      <table
        className="-my-2 overflow-x-auto border  mx-4 sm:m-8 lg:mx-1 overflowY-auto"
      >
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
            handleDelete(confirmModal.email);
            setConfirmModal({ isOpen: false, email: "" });
          }}
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, email: "" })}
          isLoading={loading}
        />
      )}
    </>
  );
};

export default EmployeesTable;
