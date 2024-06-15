import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AddTaskDrawer from "../modals/AddTaskDrawer";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import TaskTable from "../tables/TaskTable";
import LoaderComp from "../Loader";
import { UserDetails } from "../../types";
interface SidebarState {
  isOpen: boolean;
  id: string;
}
interface DashboardProps {
  type?: string;
}
const Dashboard = ({ type }: DashboardProps) => {
  const isCompletedTable = () => type === "completed_jobs";

  const { currentUser, logout } = useAuth();
  const [taskArray, setTaskArray] = useState<{ id: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<SidebarState>({
    isOpen: false,
    id: "",
  });
  const [details, setDetails] = useState<UserDetails | undefined>();
  const getUserDetail = async (): Promise<UserDetails | undefined> => {
    try {
      if (currentUser) {
        const userDetails: UserDetails = {
          name: currentUser.displayName,
          email: currentUser.email,
          role: currentUser.role,
        };
        setDetails(userDetails);
        return userDetails;
      }
    } catch (error) {
      console.error("Error getting user detail:", error);
    }
    return undefined;
  };
  const navigate = useNavigate();

  const getTaskData = async (name2: string | undefined, noLoader?: boolean) => {
    const taskCollection = collection(db, "tasks");
    console.log("user", name2);

    !noLoader && setLoading(true);
    try {
      const querySnapshot = await getDocs(
        currentUser.role === "admin" || currentUser.role === "task-creator"
          ? taskCollection
          : query(taskCollection, where("employeeAssigned", "==", `${name2}`))
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
    const userDetail = await getUserDetail();
    if (userDetail) {
      await getTaskData(currentUser.displayName);
    }
  };
  const updateTaskData = async (noLoader?: boolean) => {
    const userDetail = await getUserDetail();
    if (userDetail) {
      getTaskData(userDetail?.name, noLoader);
    }
  };
  useEffect(() => {
    const interval = setInterval(() => {
      updateTaskData(true);
      console.log("data updated every 20 seconds");
    }, 20000);

    return () => clearInterval(interval);
  }, []);
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
        <div className="m-8  w-full flex flex-col">
          <div className="flex w-full justify-between ">
            <span className=" flex items-center justify-center text-4xl font-semibold">
              {isCompletedTable() ? "Completed Jobs" : "Job Assignment"}
            </span>
            {(currentUser.role === "admin" ||
              currentUser.role === "task-creator") &&
              !isCompletedTable() && (
                <button
                  title="Create Job"
                  onClick={() => {
                    setSidebarOpen((prevSidebarState) => ({
                      ...prevSidebarState,
                      isOpen: !prevSidebarState.isOpen,
                      id: "",
                    }));
                  }}
                  className=" hover:scale-x-105 h-12 my-4 shadow-md mr-16 p-2 rounded-lg text-white w-fit bg-blue-500"
                >
                  Create Job
                </button>
              )}
          </div>
          <div className=" overflow-x-auto pr-[25px]">
            <TaskTable
              taskArray={taskArray}
              type={type}
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
