import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SideBar from "../SideBar";
import AddTaskDrawer from "../AddTaskDrawer";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import TaskTable from "../TaskTable";
import LoaderComp from "../Loader";
import { UserDetails } from "../../types";
interface SidebarState {
  isOpen: boolean;
  id: string;
}

const Dashboard = () => {
  const { currentUser, logout, getUserRoleByEmail } = useAuth();
  const [taskArray, setTaskArray] = useState<{ id: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<SidebarState>({
    isOpen: false,
    id: "",
  });
  const [details, setDetails] = useState<UserDetails | undefined>();
  const getUserDetail = async () => {
    try {
      const userRole = await getUserRoleByEmail(currentUser?.email);

      // Log the userRole for debugging
      console.log(userRole);

      if (userRole) {
        await setDetails({
          name: userRole.name,
          email: userRole.email,
          role: userRole.role,
        });
        await getTaskData(userRole.name);
      }
    } catch (error) {
      console.error("Error getting user detail:", error);
    }
  };
  const navigate = useNavigate();
  const updateTaskData = () => {
    getTaskData(details?.name);
  };
  const getTaskData = async (name2: string | undefined) => {
    const taskCollection = collection(db, "tasks");
    setLoading(true);
    try {
      const querySnapshot =
        currentUser.role === "admin"
          ? await getDocs(taskCollection)
          : await getDocs(
              query(taskCollection, where("employeeAssigned", "==", `${name2}`))
            );

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
      setLoading(false);
    } catch (error) {
      console.error("Error getting tasks:", error);
      setLoading(false);
    }
  };
  const getData = async () => {
    await getUserDetail();
    // await getTaskData();
  };
  useEffect(() => {
    getData();

    if (!currentUser) {
      navigate("/signin");
    } else {
    }
  }, [currentUser]);

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
        <div className="mx-8  w-full flex flex-col">
          <div className="flex w-full justify-start">
            {currentUser.role === "admin" && (
              <button
                onClick={() => {
                  setSidebarOpen((prevSidebarState) => ({
                    ...prevSidebarState,
                    isOpen: !prevSidebarState.isOpen,
                    id: "",
                  }));
                }}
                className="h-12 my-4 mr-16 p-2 rounded-lg w-fit bg-blue-500"
              >
                Add Task
              </button>
            )}
          </div>
          <div className="">
            <TaskTable
              taskArray={taskArray}
              setSidebarOpen={setSidebarOpen}
              updateTaskData={updateTaskData}
            />
          </div>
          {sidebarOpen.isOpen && (
            <AddTaskDrawer
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              userDetails={details}
              updateTaskData={updateTaskData}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
