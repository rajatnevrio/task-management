import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SideBar from "../SideBar";
import AddTaskDrawer from "../AddTaskDrawer";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import TaskTable from "../TaskTable";

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const [taskArray, setTaskArray] = useState<{ id: string }[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState <boolean>(false)
  const navigate = useNavigate();
  console.log("first", currentUser);


  const getTaskData = async () => {
    const taskCollection = collection(db, "tasks");
    try {
      const querySnapshot = await getDocs(taskCollection);
  
      // Convert the query snapshot to an array of objects
      const tasksArray = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        // Convert createdAt to a string or another suitable representation
        const createdAtString = `${data.createdAt.seconds}.${data.createdAt.nanoseconds}`;
        
        // Return the modified data
        return {
          id: doc.id,
          ...data,
          createdAt: createdAtString,
        };
      });
  
      setTaskArray(tasksArray);
    } catch (error) {
      console.error("Error getting tasks:", error);
    }
  };
  useEffect(() => {
    if (!currentUser) {
      // Redirect to sign-in if user is not logged in
      navigate("/signin");
    }
    getTaskData()
  }, [currentUser, navigate,sidebarOpen]);

  if (!currentUser) {
    // Render loading spinner or message while redirecting
    return <div>Loading...</div>;
  }


  return (
    <div className="flex">
      <div className="w-[15%]">
        <SideBar />
      </div>

      <div className="mx-8 w-full flex flex-col">
        <div className="flex justify-end mx-14">
         <button
            onClick={() => {
            setSidebarOpen(!sidebarOpen)
            }}
          className="h-12 m-4 p-2 rounded-lg w-fit bg-blue-500"
        >
          Add Task
        </button>
        </div>
        <div className="">
      <TaskTable taskArray={taskArray} />
      </div>
        {sidebarOpen && <AddTaskDrawer sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
      </div>
    </div>

   

  );
};

export default Dashboard;
