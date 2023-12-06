// TaskTable.tsx
import React from "react";
import { useTable, Column } from "react-table";
import { TrashIcon } from "@heroicons/react/24/outline";
import { collection, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
interface Task {
  [key: string]: string | number; // Adjust the type according to your task structure
}

interface TaskTableProps {
  taskArray: Task[];
}

const TaskTable: React.FC<TaskTableProps> = ({ taskArray }) => {
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
  const handleDelete = async (taskId: any) => {
    try {
      // Form a reference to the document using the unique ID
      const taskDocRef = doc(collection(db, "tasks"), taskId);
      
      // Delete the document
      await deleteDoc(taskDocRef);

      // Optionally, you can update the UI or show a success message
    } catch (error) {
      console.error("Error deleting document:", error);
      // Handle error, show error message, etc.
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
        link.length > 25 ? link.substring(0, 25) + "..." : link;
      return (
        <a href={link} target="_blank" rel="noopener noreferrer">
          {shortenedLink}
        </a>
      );
    };
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
      <tr className="items">
        <td className="px-4 py-4 whitespace-nowrap">{element.title}</td>
        <td className="px-4 py-4 whitespace-nowrap">{element.typeOfWork}</td>
        <td className="px-4 py-4 whitespace-nowrap">
          {element.employeeAssigned}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">{element.pp}</td>
        <td className="px-4 py-4 whitespace-nowrap">{element.jobStatus}</td>
        <td className="px-4 py-4 whitespace-nowrap">
          {element.numberOfSlides}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          {formatDownloadLink(String(element.files))}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          {formatDateTime(element.startDate)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          {formatDateTime(element.endDate)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          {formatDateTime(element.deadline)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">{formattedDate}</td>
        <td className="px-4 py-4 whitespace-nowrap">{element.instructions}</td>
        <td className="px-4 py-4 whitespace-nowrap text-sm">
          {" "}
          <TrashIcon
            style={{ height: "30px", width: "30px", cursor: "pointer" }}
            className="hover:bg-red-500 rounded-full p-1"
            onClick={() => handleDelete(element.docId)}
          />
        </td>
      </tr>
    );
  });
  const data: Task[] = React.useMemo(() => taskArray, [taskArray]);
  const tableHeaders: string[] = [
    "Title",
    "Type of Work",
    "Employee Assigned",
    "PP",
    "Job Status",
    "No. Of Slides",
    "Files",
    "Start Date",
    "End Date",
    "Deadline",
    "Created on",
    "Instructions",
    "actions",
  ];
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });
  return (
    <table
      {...getTableProps()}
      className="-my-2 overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 overflowY-auto"
    >
      <thead>
        <tr className="border p-2 bg-gray-200">
          {tableHeaders.map((header, index) => (
            <th
              key={index}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">{tableRows}</tbody>
    </table>
  );
};

export default TaskTable;
