// TaskTable.tsx
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTable, Column } from "react-table";
import { TrashIcon, PencilSquareIcon ,ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { collection, doc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "./ConfirmModal";
import { toast } from "react-toastify";
import CountdownTimer from "./CountDownTimer/CountDownTimer";
interface Task {
  [key: string]: string | number; // Adjust the type according to your task structure
}

interface TaskTableProps {
  taskArray: Task[];
  setSidebarOpen: Dispatch<SetStateAction<{ isOpen: boolean; id: string }>>;
  updateTaskData: () => void;
}
interface ModalState {
  isOpen: boolean;
  id: string | number;
}

const TaskTable: React.FC<TaskTableProps> = ({
  taskArray,
  setSidebarOpen,
  updateTaskData,
}) => {
  const columns: Column<Task>[] = React.useMemo(
    () =>
      taskArray.length > 0
        ? Object.keys(taskArray[0]).map((key) => ({
            Header: key,
            accessor: key,
          }))
        : [],
    [taskArray]
  );
  const { currentUser, logout, getUserRoles } = useAuth();
  const [confirmModal, setConfirmModal] = useState<ModalState>({
    isOpen: false,
    id: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const handleDelete = async (taskId: any) => {
    setLoading(true)
    try {
      // Form a reference to the document using the unique ID
      const taskDocRef = doc(collection(db, "tasks"), taskId);
      // Delete the document
      await deleteDoc(taskDocRef);
      setLoading(false)
      toast.success("Task Deleted Successfully");
      updateTaskData()
    } catch (error) {
      console.error("Error deleting document:", error);
      setLoading(false)
      toast.error("Failed to delete task");
    }
  };

  const tableRows = taskArray.map((element) => {
    const timestamp = element.createdAt;
    const date = new Date(Number(timestamp) * 1000);

    // Format the date without seconds
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    const formatDownloadLink = (link: string) => {
      // Display only the first 30 characters of the link
      const shortenedLink =
        link.length > 25 ? link.substring(0, 20) + "..." : link;
      return (
        <a href={link} target="_blank" rel="noopener noreferrer">
          <ArrowDownTrayIcon   style={{ height: "30px", width: "30px", cursor: "pointer" }}
            className="hover:bg-blue-500 rounded-full p-1"/>
        </a>
      );
    };

    const dateObj = new Date (element.timer)
    const formattedDate = date.toLocaleString("en-US", options);
    const formatDateTime = (timestamp: string | number) => {
      const date = new Date(timestamp.toString()); // Convert to string here

      // Check if the date is valid before proceeding
      if (isNaN(date.getTime())) {
        return "-";
      }
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      };
      return date.toLocaleString("en-US", options);
    };
    return (
      <tr className="items text-md text-center">
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {element.title}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {element.typeOfWork}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {element.employeeAssigned}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">{element.pp}</td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {element.jobStatus}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {element.numberOfSlides}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {formatDownloadLink(String(element.files))}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {formatDateTime(element.startDate)}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {formatDateTime(element.endDate)}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {formatDateTime(element.deadline)}
        </td>
        <td className="px-3 py-4 whitespace-nowrap w-[180px] border-r">
       {element.timer ? <CountdownTimer targetDate={dateObj}  /> :'-'}

        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {formattedDate}
        </td>
        {/* <td className="px-3 py-4 whitespace-nowrap border-r">{element.instructions}</td> */}
        <td className="px-3 py-4 whitespace-nowrap border-r text-sm flex">
          {" "}
          {currentUser.role === "admin" && (
            <TrashIcon
              style={{ height: "30px", width: "30px", cursor: "pointer" }}
              className="hover:bg-red-500 rounded-full p-1"
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  id: element.docId,
                })
              }
            />
          )}
          <PencilSquareIcon
            style={{ height: "30px", width: "30px", cursor: "pointer" }}
            className="hover:bg-green-500 rounded-full p-1"
            onClick={() =>
              setSidebarOpen((prevSidebarState) => ({
                ...prevSidebarState,
                isOpen: true,
                id: element?.docId?.toString(), // Ensure id is treated as a string
              }))
            }
          />
        </td>
      </tr>
    );
  });
  const data: Task[] = React.useMemo(() => taskArray, [taskArray]);
  const tableHeaders: string[] = [
    "Title",
    "Type",
    "Assignee",
    "PP",
    "Job Status",
    "Slides",
    "Files",
    "Start Date",
    "End Date",
    "Deadline",
    "Timer",
    "Created on",
    // "Instructions",
    "actions",
  ];
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });
  return (
    <>
      <table
        {...getTableProps()}
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
          message="Are you sure you want to delete this task?"
          confirmButton="Delete task"
          onConfirm={() => {
            handleDelete(confirmModal.id);
            setConfirmModal({ isOpen: false, id: "" });
          }}
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, id: "" })}
          isLoading={loading}
        />
      )}
    </>
  );
};

export default TaskTable;
