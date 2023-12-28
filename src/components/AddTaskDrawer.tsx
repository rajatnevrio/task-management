import React, {
  ChangeEvent,
  Dispatch,
  Fragment,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import {
  DocumentReference,
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Dialog, Transition } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { DocumentData } from "@firebase/firestore-types";

import { db } from "../firebase/firebase";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import LoaderComp from "./Loader";
import { UserDetails } from "../types";
import axios from "axios";
interface SidebarState {
  isOpen: boolean;
  id: string;
}

interface AddTaskDrawerProps {
  sidebarOpen: SidebarState;
  setSidebarOpen: Dispatch<SetStateAction<{ isOpen: boolean; id: string }>>;
  updateTaskData: () => void;
  userDetails?: UserDetails;
}
interface rolesApi {
  email: string;
  displayName: string;
  role: string;
}
const AddTaskDrawer: React.FC<AddTaskDrawerProps> = ({
  sidebarOpen,
  setSidebarOpen,
  updateTaskData,
  userDetails,
}) => {
  const [formData, setFormData] = useState({
    // title: "",
    numberOfSlides: 1,
    typeOfWork: "",
    pp: 1,
    employeeAssigned: "",
    startDate: "",
    endDate: "",
    deadline: "",
    files: [] as { name: string; url: string }[],
    instructions: "",
    jobStatus: "unassigned",
    timer: "",
  });
  const [list, setList] = useState<rolesApi[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { getUserRoles, currentUser } = useAuth();
  const formattedDate = (date: any) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    return isoString;
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (name === "jobStatus" && value === "inprogress") {
      const currentDate = new Date();
      // Construct the ISO-like string
      const timer = new Date();
      const ppValue = formData.pp.toString();
      const minutesToAdd = parseInt(ppValue, 10) * 1;
      timer.setMinutes(timer.getMinutes() + minutesToAdd);

      setFormData((prevData) => ({
        ...prevData,
        startDate: formattedDate(currentDate),
        endDate: "",
        timer: formattedDate(timer),
      }));
    }
    if (
      name === "jobStatus" &&
      (value === "completed" || value === "handover")
    ) {
      const currentDate = new Date();

      const endDate = new Date();

      const ppValue = formData.pp.toString();
      endDate.setMinutes(endDate.getMinutes() + parseInt(ppValue, 10) * 6);
      setFormData((prevData) => ({
        ...prevData,
        endDate: formattedDate(currentDate),
        timer: "",
      }));
    }
    if (
      name === "jobStatus" &&
      (value === "unassigned" || value === "notstarted")
    ) {
      setFormData((prevData) => ({
        ...prevData,
        startDate: "",
        endDate: "",
        timer: "",
      }));
    }
  };
  const addValueTime = () => {
    const timer = new Date();
    const ppValue = formData.pp.toString();
    const minutesToAdd = parseInt(ppValue, 10) * 1;
    timer.setMinutes(timer.getMinutes() + minutesToAdd);
    return { timer: formattedDate(timer), startTime: formattedDate(timer) };
  };
  const getDocById = async (docId: string) => {
    setLoading(true);
    try {
      // Form a reference to the document using the unique ID
      const docRef = doc(collection(db, "tasks"), docId);

      // Get the document
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const docData = docSnap.data();
        setFormData((prevData) => ({
          ...prevData,
          ...docData,
        }));
        setLoading(false);

        return docData;
      } else {
        setLoading(false);
        console.log(
          `Document with ID ${docId} does not exist in collection ${"tasks"}`
        );
        return null;
      }
    } catch (error) {
      console.error(
        `Error getting document from collection ${"tasks"}:`,
        error
      );
      throw error; // Re-throw the error for handling in the calling code
    }
  };
  const updateDocById = async (docId: string, updatedData: any) => {
    try {
      const docRef = doc(collection(db, "tasks"), docId);
      await updateDoc(docRef, updatedData);
    } catch (error) {
      console.error(`Error updating document with ID ${docId}:`, error);
      throw error;
    }
  };
  const isFieldDisabled = () => userDetails?.role === "employee";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);

    const files = e.target.files;
    if (files && files.length > 0) {
      const fileUploadPromises = Array.from(files).map(async (file: File) => {
        const filename = `${file.name}`;
        const storageRef = ref(storage, `files/${filename}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Wait for the upload to complete
        await uploadTask;

        // Get the download URL for the uploaded file
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // Return an object with name and url properties
        return { name: filename, url: downloadURL };
      });

      // Wait for all file uploads to complete
      const newFiles = await Promise.all(fileUploadPromises);

      // Display a success message
      setLoading(false);

      // Overwrite previous files with new files
      setFormData((prevData: any) => ({
        ...prevData,
        files: [...prevData.files, ...newFiles],
      }));

      toast.success("Files uploaded successfully");
    }
  };
  const storage = getStorage();
  const getData = async () => {
    try {
      // Replace the API call with the getAllUsers API using Axios
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/getUsersByRole/employee`
      );

      const users = response.data;
      setList(users);
    } catch (error: any) {
      console.error("Error fetching user data:", error.message);
      // Handle error accordingly, e.g., show an error message to the user
    }
  };

  useEffect(() => {
    if (sidebarOpen?.id?.length > 1) {
      getDocById(sidebarOpen.id);
    }
    getData();
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Fetch the current job counter
      const counterDocRef = doc(db, "counters", "jobCounter");
      const counterDocSnap = await getDoc(counterDocRef);
      let lastJobNumber = 1;
  
      if (counterDocSnap.exists()) {
        lastJobNumber = counterDocSnap.data().lastJobNumber || 1;
      }
  
      // Construct the new title ID
      const newJobNumber = lastJobNumber + 1;
      const newTitleId = `MS-JOB${String(newJobNumber).padStart(5, "0")}`;
  
      const { ...formDataWithoutFiles } = formData;
  
      // If updating an existing task
      if (sidebarOpen?.id?.length > 1) {
        await updateDocById(sidebarOpen.id, {
          ...formDataWithoutFiles,
          titleId: newTitleId,
        });
      } else {
        // If adding a new task
        const docRef = await addDoc(collection(db, "tasks"), {
          ...formDataWithoutFiles,
          createdAt: serverTimestamp(),
          timer: addValueTime().timer,
          startDate: addValueTime().startTime,
          titleId: newTitleId,
        });
  
        // Update the task document with the newly created ID
        await updateDoc(docRef, {
          docId: docRef.id,
        });
      }
  
      // Update the job counter
      await setDoc(counterDocRef, { lastJobNumber: newJobNumber });
  
      updateTaskData();
      setLoading(false);
  
      // Close the modal
      setSidebarOpen((prevSidebarState) => ({
        ...prevSidebarState,
        isOpen: !prevSidebarState.isOpen,
        id: "",
      }));
    } catch (error: any) {
      toast.error(error);
      setLoading(false);
      console.error("Error handling form submission:", error);
    }
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  return (
    <>
      {
        <Transition.Root show={sidebarOpen.isOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            onClose={() =>
              setSidebarOpen((prevSidebarState) => ({
                ...prevSidebarState,
                isOpen: false,
              }))
            }
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                    {loading ? (
                      <div className="flex w-full justify-center items-center min-h-[50vh]">
                        {" "}
                        <LoaderComp />
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="mt-1 text-center sm:my-1 ">
                            <Dialog.Title
                              as="h1"
                              className="text-3xl font-bold leading-6 text-gray-900  pb-6"
                            >
                              {sidebarOpen?.id?.length > 1
                                ? "Update Job Sheet"
                                : "Create Job Sheet"}
                            </Dialog.Title>
                            <div className="mt-2 text-[20px]">
                              <form onSubmit={handleSubmit}>
                                <div className="mt-2 flex flex-col grid grid-cols-2 gap-4 items-start">
                                  <div className="w-full flex flex-col gap-y-[20px]">
                                    {/* <label className="w-full flex">
                                      Task Title:
                                      <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="ml-5 border "
                                        disabled={isFieldDisabled()}
                                      />
                                    </label> */}
                                    <label className="w-full flex">
                                      Number of Slides:
                                      <input
                                        type="number"
                                        name="numberOfSlides"
                                        value={formData.numberOfSlides}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        className="ml-5 border my-1 "
                                        disabled={isFieldDisabled()}
                                      />
                                    </label>

                                    <label className="w-full flex">
                                      Type of Work:
                                      <select
                                        name="typeOfWork"
                                        value={formData.typeOfWork}
                                        onChange={handleInputChange}
                                        required
                                        className="ml-5 border my-1"
                                        disabled={isFieldDisabled()}
                                      >
                                        {/* Dynamic values for Type of Work */}
                                        <option value="">
                                          Select Type of Work
                                        </option>
                                        <option value="design">Design</option>
                                        <option value="development">
                                          Development
                                        </option>
                                        {/* Add more options as needed */}
                                      </select>
                                    </label>
                                    <label className="w-full flex">
                                      Job Status:
                                      <select
                                        name="jobStatus"
                                        value={formData.jobStatus}
                                        onChange={handleInputChange}
                                        className="ml-5 border my-1"
                                      >
                                        <option value="unassigned">
                                          Unassigned
                                        </option>
                                        <option value="notstarted">
                                          Not Started
                                        </option>
                                        <option value="inprogress">
                                          In Progress
                                        </option>
                                        <option value="completed">
                                          Completed
                                        </option>
                                        <option value="handover">
                                          Handover
                                        </option>
                                      </select>
                                    </label>

                                    <label className="w-full flex">
                                      PP (1 PP = 6 mins):
                                      <input
                                        type="number"
                                        name="pp"
                                        value={formData.pp}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        disabled={isFieldDisabled()}
                                        className="ml-5 border my-1"
                                      />
                                    </label>
                                  </div>
                                  <div className="w-full flex flex-col gap-y-[20px] ">
                                    <label className="w-full flex">
                                      Employee to be assigned:
                                      <select
                                        name="employeeAssigned"
                                        value={formData.employeeAssigned}
                                        onChange={handleInputChange}
                                        className="ml-5 border my-1"
                                        disabled={isFieldDisabled()}
                                      >
                                        <option value="">
                                          Select Employee
                                        </option>
                                        {list.map((employee) => (
                                          <option
                                            key={employee.displayName}
                                            value={employee.displayName}
                                          >
                                            {employee.displayName}
                                          </option>
                                        ))}{" "}
                                        {/* Add more options as needed */}
                                      </select>
                                    </label>
                                    <label className="w-full flex">
                                      Start Date/Time:
                                      <input
                                        type="datetime-local"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        className="ml-5 border my-1"
                                      />
                                    </label>

                                    <label className="w-full flex">
                                      End Date/Time:
                                      <input
                                        type="datetime-local"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        className="ml-5 border my-1"
                                      />
                                    </label>

                                    <label className="w-full flex">
                                      Deadline :
                                      <input
                                        type="datetime-local"
                                        name="deadline"
                                        value={formData.deadline}
                                        onChange={handleInputChange}
                                        className="ml-5 border my-1"
                                        disabled={isFieldDisabled()}
                                      />
                                    </label>
                                    {/* Other form fields go here */}
                                    {/* ... */}

                                    <label className="w-full flex items-center">
                                      Files:
                                      <input
                                        type="file"
                                        name="files"
                                        onChange={handleFileUpload}
                                        multiple
                                        className="ml-5 border my-1 opacity-0 h-8 w-8"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                                        disabled={isFieldDisabled()}
                                      />
                                      <span className="border text-[16px]  p-1 cursor-pointer hover:bg-gray-200 rounded-lg">
                                        {/* Customize the appearance of the label */}
                                        Choose Files
                                      </span>
                                    </label>
                                    {formData.files.length > 0 && (
                                      <div className="flex gap-x-[20px]">
                                        <p>Uploaded Files:</p>
                                        <ul>
                                          {formData.files.map((file, index) => (
                                            <li key={index}>
                                              <a
                                                href={file.url} // Assuming 'url' is the property containing the file URL
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="file-link hover:underline hover:text-blue-500"
                                              >
                                                {file.name}
                                              </a>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className=" flex w-full">
                                  <label className="flex items-center w-full">
                                    Instructions:
                                    <textarea
                                      name="instructions"
                                      value={formData.instructions}
                                      onChange={handleTextareaChange}
                                      disabled={isFieldDisabled()}
                                      className="ml-5 border my-1 min-w-[35%] h-[8vh]"
                                    />
                                  </label>
                                </div>
                                <div className="flex w-full gap-x-6 ">
                                  <button
                                    title="Submit"
                                    type="submit"
                                    // onClick={() => {
                                    //   if (formData.jobStatus === "inprogress")
                                    //     setFormData((prevData: any) => ({
                                    //       ...prevData,
                                    //       timer: addValueTime().timer,
                                    //       startDate: addValueTime().startTime,
                                    //     }));
                                    // }}
                                    className=" w-[50%] mt-8 justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                  >
                                    {sidebarOpen?.id?.length > 1
                                      ? "Update"
                                      : "Create"}
                                  </button>
                                  {/* <div className="mt-5 sm:mt-6"> */}
                                  <button
                                    type="button"
                                    title="Cancel"
                                    className=" w-[50%] justify-center rounded-md bg-red-600 mt-8 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                    onClick={(event) => {
                                      // Handle the event if needed
                                      setSidebarOpen((prevSidebarState) => ({
                                        ...prevSidebarState,
                                        isOpen: !prevSidebarState.isOpen,
                                        id: "",
                                      }));
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  {/* </div> */}
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      }
    </>
  );
};
export default AddTaskDrawer;
