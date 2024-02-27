import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import AddTaskDrawer from "../modals/AddTaskDrawer";
import LoaderComp from "../Loader";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { AddModalState, IntakeFiles, UserDetails } from "../../types";
import EmployeesTable from "../tables/EmployeesTable";
import AddEmployee from "../modals/AddEmployee";
import axios from "axios";
import UploadFiles from "../modals/UploadFiles";
import IntakeFilesTable from "../tables/IntakeFilesTable";
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
interface SidebarState {
  isOpen: boolean;
  id: string;
}
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
function IntakeFilesComponent() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [intakeFiles, setIntakeFiles] = useState<IntakeFiles[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<SidebarState>({
    isOpen: false,
    id: "",
  });
  const [details, setDetails] = useState<UserDetails | undefined>();
  const [filesToAssign, setFilesToAssign] = useState<string[]>([]);

  const [modalState, setModalState] = useState<AddModalState>({
    isOpen: false,
    details: {
      displayName: "",
      uid: "",
      email: "",
      role: "",
    },
  });

  const getUserDetail = async () => {
    try {
      // Log the userRole for debugging
      if (currentUser) {
        await setDetails({
          name: currentUser.displayName,
          email: currentUser.email,
          role: currentUser.role,
        });
      }
    } catch (error) {
      console.error("Error getting user detail:", error);
    }
  };

  const navigate = useNavigate();
  const updateData = () => {
    fetchIntakeFiles();
  };
  const fetchIntakeFiles = async () => {
    try {
      setLoading(true);
      const IntakeFilesCollection = collection(db, "IntakeFiles");
      const q = query(IntakeFilesCollection);
      const querySnapshot = await getDocs(q);
      const files = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          file_name: data.file_name,
          total_pages: data.total_pages,
          url: data.url,
          file_id: data.file_id,
        };
      });
      setIntakeFiles(files);
      setLoading(false);
    } catch (error) {
      setLoading(false);

      console.error("Error fetching types of jobs:", error);
      // Handle error accordingly
    }
  };
  useEffect(() => {
    getUserDetail();

    if (!currentUser) {
      navigate("/signin");
    } else {
    }
  }, [currentUser]);
  useEffect(() => {
    fetchIntakeFiles();
  }, []);

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
        <div className={`w-full flex flex-col m-8`}>
          <div className="flex w-full justify-between ">
            <span className=" flex items-center justify-center text-4xl font-semibold">
              Intake Files
            </span>
            {currentUser.role === "admin" && (
              <button
                title={"Upload files"}
                onClick={() => {
                  setModalState((prev) => ({
                    ...prev,
                    isOpen: !modalState.isOpen,
                  }));
                }}
                className="h-12 my-4 mr-16 p-2 rounded-lg text-white w-fit bg-blue-500"
              >
                Upload Files
              </button>
            )}
          </div>

          <div className=" overflow-y-auto">
            {intakeFiles.length > 0 && !loading ? (
              <IntakeFilesTable
                files={intakeFiles}
                modalState={modalState}
                setModalState={setModalState}
                updateTaskData={updateData}
                setSidebarOpen={setSidebarOpen}
                filesToAssign={filesToAssign}
                setFilesToAssign={setFilesToAssign}
              />
            ) : (
              <p className="flex text-xl justify-center items-center h-[300px]">
                No Unassigned Files found
              </p>
            )}
          </div>
          {modalState.isOpen && (
            <UploadFiles
              modalState={modalState}
              setModalState={setModalState}
              updateTaskData={updateData}
            />
          )}
          {sidebarOpen.isOpen && (
            <AddTaskDrawer
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              userDetails={details}
              updateTaskData={updateData}
              filesToAssign={intakeFiles.filter((file) =>
                filesToAssign.includes(file.file_id)
              )}
            />
          )}
        </div>
      )}
      <div></div>
    </div>
  );
}

export default IntakeFilesComponent;
