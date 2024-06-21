import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTable, Column } from "react-table";
import {
  TrashIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { collection, doc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../contexts/AuthContext";
import ConfirmModal from "../modals/ConfirmModal";
import { toast } from "react-toastify";
import CountdownTimer from "../CountDownTimer/CountDownTimer";
import { statusOptions } from "../modals/AddTaskDrawer";

interface Task {
  [key: string]: string | number; // Adjust the type according to your task structure
}
interface fileType {
  name: string;
  url: string;
}
interface TaskTableProps {
  taskArray: Task[];
  setSidebarOpen: Dispatch<SetStateAction<{ isOpen: boolean; id: string }>>;
  updateTaskData: () => void;
  type?: string;
}
interface ModalState {
  isOpen: boolean;
  id: string | number;
}

const TaskTable: React.FC<TaskTableProps> = ({
  taskArray,
  setSidebarOpen,
  updateTaskData,
  type,
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
  const { currentUser, logout } = useAuth();
  const [confirmModal, setConfirmModal] = useState<ModalState>({
    isOpen: false,
    id: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(taskArray);

  useEffect(() => {
    if (selectedAssignee) {
      setFilteredTasks(
        taskArray.filter((task) => task.employeeAssigned === selectedAssignee)
      );
    } else {
      setFilteredTasks(taskArray);
    }
  }, [selectedAssignee, taskArray]);

  const handleDelete = async (taskId: any) => {
    setLoading(true);
    try {
      const taskDocRef = doc(collection(db, "tasks"), taskId);
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
  const isAdminOrTaskCreator = () => {
    return currentUser.role === "admin" || currentUser.role === "task-creator";
  };
  const sortedTaskArray = filteredTasks
    .filter((task) => {
      if (isAdminOrTaskCreator() && type === "completed_jobs") {
        return task.jobStatus === "completed" || task.jobStatus === "handover";
      } else if (isAdminOrTaskCreator() && type !== "completed_jobs") {
        return task.jobStatus !== "completed" && task.jobStatus !== "handover";
      } else {
        return true;
      }
    })
    .sort((a, b) => {
      const aTitleIdNumber = parseInt((a.titleId as string).slice(6), 10);
      const bTitleIdNumber = parseInt((b.titleId as string).slice(6), 10);

      return bTitleIdNumber - aTitleIdNumber;
    });

  const uniqueAssignees = Array.from(
    new Set(taskArray.map((task) => task.employeeAssigned))
  );
  const tableRows = sortedTaskArray.map((element, index) => {
    const timestamp = element.createdAt;
    const date = new Date(Number(timestamp) * 1000);

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    const isEditIconVisible = element.endDate
      ? new Date(element.endDate).getTime() + 60 * 30 * 1000 >
          new Date().getTime() || isAdminOrTaskCreator()
      : true;
    const formatDownloadLink = (link: fileType[] | string | number) => {
      return (
        <ul>
          {(link as fileType[])?.map((file: fileType, index: number) => (
            <li key={index}>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="file-link hover:underline hover:text-blue-500"
              >
                {file.name.length > 15
                  ? file.name.substring(0, 15) + "..."
                  : file.name}
              </a>
            </li>
          ))}
        </ul>
      );
    };

    const dateObj = new Date(element.timer);
    const formattedDate = date.toLocaleString("en-US", options);
    const formatDateTime = (timestamp: string | number) => {
      const date = new Date(timestamp.toString());

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
      <tr
        className="items text-md text-center transition-all duration-300 hover:bg-gray-100"
        key={index}
      >
        <td className="px-3 py-4 whitespace-nowrap border-r font-semibold">
          {element.titleId}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {element.typeOfWork}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {element.employeeAssigned}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">{element.pp}</td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {statusOptions[element.jobStatus]}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {element.numberOfSlides}
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
        <td className="px-3 py-4 whitespace-nowrap border-r w-[180px]">
          {element.timer ? <CountdownTimer targetDate={dateObj} /> : "-"}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r">
          {formattedDate}
        </td>
        <td className="px-3 py-4 whitespace-nowrap border-r text-sm ">
          <div className="flex">
            {isAdminOrTaskCreator() && (
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
                  setConfirmModal({ isOpen: true, id: element.docId })
                }
              />
            )}
            {isEditIconVisible ? (
              <PencilSquareIcon
                title="Edit task"
                style={{
                  height: "30px",
                  width: "30px",
                  cursor: "pointer",
                  color: "blue ",
                }}
                className="hover:scale-125 rounded-full p-1 ml-2"
                onClick={() =>
                  setSidebarOpen((prevSidebarState) => ({
                    ...prevSidebarState,
                    isOpen: true,
                    id: element?.docId?.toString(),
                  }))
                }
              />
            ) : (
              <PencilSquareIcon
                title="Editing is not permitted after 30 minutes of submission."
                style={{ height: "30px", width: "30px", cursor: "not-allowed" }}
                className="hover:scale-125 rounded-full p-1 ml-2"
              />
            )}
          </div>
        </td>
      </tr>
    );
  });

  const data: Task[] = React.useMemo(() => taskArray, [taskArray]);
  const tableHeaders: string[] = [
    "TitleId",
    "Type",
    "Assignee",
    "P.P",
    "Job Status",
    "Pages",
    "Start Date",
    "End Date",
    "Deadline",
    "Timer",
    "Created on",
    "actions",
  ];
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });

  return (
    <>
      {isAdminOrTaskCreator() && (
        <div className="flex justify-between items-center my-4">
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Assignees</option>
            {uniqueAssignees.map((assignee, index) => (
              <option key={index} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
        </div>
      )}
      <table
        {...getTableProps()}
        className="w-full -my-2 shadow-md overflow-x-auto border mx-4 sm:m-8 lg:mx-1 overflowY-auto"
      >
        <thead>
          <tr className="bg-gray-200 border rounded p-2">
            {tableHeaders.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 border-r-2 border-gray-300 text-center text-md font-medium text-gray-700 uppercase tracking-wider"
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
