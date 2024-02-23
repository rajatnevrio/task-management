import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTable, Column } from "react-table";
import axios from "axios";

import {
  TrashIcon,
  ArrowRightIcon,
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
import { AddModalState, Employee, IntakeFiles } from "../../types";
import { deleteObject, getStorage, ref } from "firebase/storage";
import LoaderComp from "../Loader";

interface rolesApi {
  email: string;
  name: string;
  role: string;
  displayName: string;
  uid: string;
}
interface IntakeFilesTableProps {
  files: IntakeFiles[];
  modalState: AddModalState;
  setModalState: Dispatch<SetStateAction<AddModalState>>;
  updateTaskData: () => void;
  type?: string;
}
interface ModalState {
  isOpen: boolean;
  file_id: string;
  index: number;
}

const IntakeFilesTable: React.FC<IntakeFilesTableProps> = ({
  files,
  modalState,
  setModalState,
  updateTaskData,
  type,
}) => {
  const { currentUser } = useAuth();

  const [confirmModal, setConfirmModal] = useState<ModalState>({
    isOpen: false,
    file_id: "",
    index: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [filesToAssign, setFilesToAssign] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const handleMultiDelete = async (fileIds: string[]) => {
    try {
      // Create an array to hold all delete promises
      const deletePromises: Promise<void>[] = [];
      setLoading(true);
      // Iterate over the array of file IDs
      for (const fileId of fileIds) {
        setFilesToAssign((prev) => prev.filter((id) => id !== fileId));

        // Create a query to find the document with the given file_id
        const q = query(
          collection(db, "IntakeFiles"),
          where("file_id", "==", fileId)
        );

        // Execute the query
        const querySnapshot = await getDocs(q);

        // Check if any document matches the query
        if (!querySnapshot.empty) {
          // Iterate over the query results (should be only one document)
          querySnapshot.forEach(async (doc) => {
            try {
              // Delete the file from Firebase Storage
              const storageRef = ref(getStorage(), `Intake/${fileId}`);
              const deleteStoragePromise = deleteObject(storageRef);

              // Delete the document from Firestore
              const deleteFirestorePromise = deleteDoc(doc.ref);

              // Add both promises to the array
              deletePromises.push(deleteStoragePromise, deleteFirestorePromise);
            } catch (error) {
              console.error("Error deleting file:", error);
              toast.error("Failed to delete file");
              setSelectAll(false);

              setLoading(false);
            }
          });
        } else {
          console.error("No document found with file_id:", fileId);
          toast.error("Failed to delete file: No document found");
          setSelectAll(false);
          setLoading(false);
        }
      }

      // Wait for all promises to resolve
      await Promise.all(deletePromises);

      // Display a single toast when all files are deleted
      toast.success("Selected files deleted successfully");
      setSelectAll(false);
      setLoading(false);

      updateTaskData();
    } catch (error) {
      console.error("Error deleting files:", error);
      toast.error("Failed to delete files");
      setSelectAll(false);
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      setLoading(true);
      // Create a query to find the document with the given file_id
      const q = query(
        collection(db, "IntakeFiles"),
        where("file_id", "==", fileId)
      );

      // Execute the query
      const querySnapshot = await getDocs(q);

      // Check if any document matches the query
      if (!querySnapshot.empty) {
        // Iterate over the query results (should be only one document)
        querySnapshot.forEach(async (doc) => {
          try {
            // Delete the file from Firebase Storage
            const storageRef = ref(getStorage(), `Intake/${fileId}`);
            await deleteObject(storageRef);

            // Delete the document from Firestore
            await deleteDoc(doc.ref);
            updateTaskData();

            toast.success("File deleted successfully");
            setLoading(false);

            updateTaskData();
          } catch (error) {
            console.error("Error deleting file:", error);
            setLoading(false);

            toast.error("Failed to delete file");
          }
        });
      } else {
        console.error("No document found with file_id:", fileId);
        toast.error("Failed to delete file: No document found");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error querying documents:", error);
      toast.error("Failed to delete file");
      setLoading(false);
    }
  };
  const handleCheckboxChange = (fileId: string) => {
    if (filesToAssign.includes(fileId)) {
      setSelectAll(false);

      setFilesToAssign((prev) => prev.filter((id) => id !== fileId));
    } else {
      setFilesToAssign((prev) => [...prev, fileId]);
    }
    // setFilesToAssign((updateD: any) => {
    //   console.log("first12", updateD);
    //   return updateD;
    // });
  };
  const tableRows = files.map((element, index) => {
    return (
      <tr className="items text-md text-center">
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {" "}
          <input
            type="checkbox"
            checked={filesToAssign.includes(element.file_id)}
            onChange={() => handleCheckboxChange(element.file_id)}
          />
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">{index + 1}.</td>
        <td className="px-3 py-4 whitespace-pre-line overflow-hidden border-r max-w-[45vw] break-all">
          {element.file_name}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {element.total_pages}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r text-sm flex">
          {" "}
          {currentUser.role === "admin" && (
            <TrashIcon
              title="Delete file"
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
                  file_id: element.file_id,
                  index: index,
                })
              }
              // onClick={()=>{
              //     handleDelete(element.file_id,index)
              // }}
            />
          )}
          {/* <PencilSquareIcon
            title="Edit task"
            style={{
              height: "30px",
              width: "30px",
              cursor: "pointer",
              color: "blue",
            }}
            className="hover:scale-125 rounded-full p-1"
            // onClick={() =>
            //   setModalState((prevSidebarState) => ({
            //     ...prevSidebarState,
            //     isOpen: true,
            //     details: element,
            //   }))
            // }
          /> */}
        </td>
      </tr>
    );
  });
  const tableHeaders: string[] = [
    "S.No.",
    "File Name",
    "No. of pages",
    "actions",
  ];
  const handleSelectAllCheckbox = () => {
    setSelectAll((prev) => !prev);
    if (!selectAll) {
      // If selectAll is false, set filesToAssign to include all file IDs
      setFilesToAssign(files.map((file) => file.file_id));
    } else {
      // If selectAll is true, uncheck all checkboxes and clear filesToAssign
      setFilesToAssign([]);
    }
  };
  function getTotalPages(files: { total_pages?: string | number }[]): number {
    console.log("first", files);
    return files.reduce<number>((totalPages, file) => {
      const totalPagesOfFile =
        typeof file.total_pages === "string"
          ? Number(file.total_pages)
          : file.total_pages || 0;
      return totalPages + totalPagesOfFile;
    }, 0);
  }
  return (
    <>
      <div className="flex ">
        {files.length > 0 && (
          <span>
            Total Number of Unassigned Pages: &nbsp;
            {getTotalPages(files)}
          </span>
        )}
      </div>
      {files.length > 0 && filesToAssign.length > 0 && (
        <div className="mt-3 flex justify-between max-w-[62vw] px-4 pt-4  gap-x-4 items-center">
          <div className="gap-x-4 flex">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAllCheckbox}
            />
            <span className="min-w-[85px]">
              {selectAll ? `Unselect All` : ` Select All `}
            </span>
          </div>
          <span className="flex gap-x-2">
            {/* (Selected files): {getTotalPages(filesToAssign)} */}
            <TrashIcon
              title="Delete file"
              style={{
                height: "28px",
                width: "28px",
                cursor: "pointer",
                color: "red",
              }}
              className="hover:scale-125 rounded-full "
              //   onClick={() => {
              //     handleMultiDelete(filesToAssign);
              //   }}
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  file_id: "multiiDeltt",
                  index: 0,
                })
              }
            />
            <button className="flex gap-x-2 bg-blue-500 rounded-md p-1 px-2 text-white items-center">
              Assign
              <ArrowRightIcon
                title="Delete task"
                style={{
                  height: "20px",
                  width: "20px",
                  cursor: "pointer",
                  color: "white",
                }}
                className="hover:scale-125 rounded-full "
                onClick={() => {
                  handleMultiDelete(filesToAssign);
                }}
              />
            </button>
          </span>
        </div>
      )}
      {loading ? (
        <div className="flex w-full justify-center items-center min-h-[60vh]">
          {" "}
          <LoaderComp />
        </div>
      ) : (
        <table className="-my-2 overflow-x-auto border mt-4  mx-4  lg:mx-1 overflowY-auto">
          <thead>
            <tr className="border  rounded p-2 bg-gray-200">
              <th className="px-2 py-2 border-r-2 border-gray-300 text-center text-md font-medium text-gray-500 uppercase tracking-wider"></th>
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
          <tbody className="bg-white divide-y divide-gray-200">
            {tableRows}
          </tbody>
        </table>
      )}
      {confirmModal.isOpen && (
        <ConfirmModal
          message={`Are you sure you want to delete ${
            confirmModal.file_id === "multiiDeltt" && filesToAssign.length > 1
              ? `these ${filesToAssign.length} files`
              : "this file"
          } ?`}
          confirmButton="Delete"
          onConfirm={() => {
            confirmModal.file_id === "multiiDeltt"
              ? handleMultiDelete(filesToAssign)
              : handleDelete(confirmModal.file_id);
            setConfirmModal({ isOpen: false, file_id: "", index: 0 });
          }}
          isOpen={confirmModal.isOpen}
          onClose={() =>
            setConfirmModal({ isOpen: false, file_id: "", index: 0 })
          }
          isLoading={loading}
        />
      )}
    </>
  );
};

export default IntakeFilesTable;
