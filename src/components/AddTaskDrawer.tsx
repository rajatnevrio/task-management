import React, {
  ChangeEvent,
  Dispatch,
  Fragment,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  DocumentReference,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Dialog, Transition } from "@headlessui/react";
import {
  TrashIcon,
  PlusIcon,
  PencilSquareIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

import { db } from "../firebase/firebase";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { toast } from "react-toastify";
import LoaderComp from "./Loader";
import { UserDetails } from "../types";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
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
type LoadingState = {
  loading: boolean;
  type: string; // You can replace 'string' with the actual type you want
};
export const statusOptions: { [key: string]: string } = {
  unassigned: "Unassigned",
  notstarted: "Not Started",
  inprogress: "In Progress",
  completed: "Completed",
  handover: "Handover",
};
pdfjsLib.GlobalWorkerOptions.workerSrc = "path/to/pdf.worker.js";
const AddTaskDrawer: React.FC<AddTaskDrawerProps> = ({
  sidebarOpen,
  setSidebarOpen,
  updateTaskData,
  userDetails,
}) => {
  const [formData, setFormData] = useState({
    // title: "",
    numberOfSlides: 0,
    typeOfWork: "",
    pp: 1,
    employeeAssigned: "",
    startDate: "",
    endDate: "",
    deadline: "",
    sourceFiles: [] as {
      name: string;
      url: string;
      id: string;
      status: boolean;
      totalPages: number | 0;
    }[],
    submitFiles: [] as {
      name: string;
      url: string;
      id: string;
      status: boolean;
    }[],
    instructions: "",
    jobStatus: "unassigned",
    timer: "",
  });
  const [list, setList] = useState<rolesApi[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    loading: false,
    type: "",
  });
  const [typesOfJobs, setTypesOfJobs] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const sourceFileInputRef = useRef<HTMLInputElement>(null);
  const submitFileInputRef = useRef<HTMLInputElement>(null);

  const [newTypeOfWork, setNewTypeOfWork] = useState("");
  const [selectedTypeOfWork, setSelectedTypeOfWork] = useState<string>("");

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
  const [modeOfWork, setModeOfWork] = useState<string | null>(null);
  const recalculateTimer = (ppValue: string) => {
    const currentDate = new Date();
    const timer = new Date();
    const minutesToAdd = parseInt(ppValue, 10) * 6;
    timer.setMinutes(timer.getMinutes() + minutesToAdd);

    setFormData((prevData) => ({
      ...prevData,
      startDate: formattedDate(currentDate),
      endDate: "",
      timer: formattedDate(timer),
      deadline: formattedDate(timer),
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "deleteTypeOfWork") {
      setSelectedTypeOfWork(value);
    }
    if (name === "newTypeOfWork") {
      setNewTypeOfWork(value);
    } else {
      // For other inputs, update the formData state
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
    if (name === "pp") {
      const jobStatus = formData.jobStatus;
      if (jobStatus === "inprogress") {
        recalculateTimer(value.toString());
      }
    }
    if (name === "jobStatus" && value === "inprogress") {
      recalculateTimer(formData.pp.toString());
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
        deadline: "",
      }));
    }
    if (name === "employeeAssigned" && value !== "") {
      // If yes, automatically set the "jobStatus" to "notstarted"
      setFormData((prevData) => ({
        ...prevData,
        jobStatus: "notstarted",
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
    setLoading({ ...loading, loading: true, type: "main" });
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
        setLoading({ ...loading, loading: false, type: "" });
        return docData;
      } else {
        setLoading({ ...loading, loading: false, type: "" });
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
  function isDate24HoursAgo(dateString: string): boolean {
    const inputDate: Date = new Date(dateString);
    const currentTime: Date = new Date();
    // Calculate the time difference in milliseconds
    const timeDifference: number = currentTime.getTime() - inputDate.getTime();
    // Calculate the time difference in hours
    const hoursDifference: number = timeDifference / (1000 * 60 * 60);
    // Return true if the time difference is less than or equal to 24 hours, otherwise false
    return hoursDifference >= 24;
  }
  const updateDocById = async (docId: string, updatedData: any) => {
    try {
      const docRef = doc(collection(db, "tasks"), docId);
      await updateDoc(docRef, updatedData);
    } catch (error) {
      console.log("first", updatedData);

      console.error(`Error updating document with ID ${docId}:`, error);
      throw error;
    }
  };
  const isUserEmployee = () => userDetails?.role === "employee";
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoading({ ...loading, loading: true, type: `${e.target.name}` });
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileUploadPromises = Array.from(files).map(async (file: File) => {
        const originalFileName = file.name;
        const timestamp = Date.now();
        const uniqueId = `${originalFileName}_${timestamp}`;
        const filename = `${uniqueId}`;
        const storageRef = ref(storage, `files/${filename}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        let pages: number | undefined;

        // Wait for the upload to complete
        await uploadTask;

        // Get the download URL for the uploaded file
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        let fileReader = new FileReader();
        const pagesPromise = new Promise<number>((resolve, reject) => {
          fileReader.onload = function () {
            if (fileReader.result && isPDF(fileReader.result as ArrayBuffer)) {
              let typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
              const task = pdfjsLib.getDocument(typedArray);
              task.promise
                .then((pdf) => {
                  pages = pdf.numPages;
                  console.log("Number of pages:", pages);
                  resolve(pages); // Resolve the promise with the number of pages
                })
                .catch(reject);
            } else {
              reject(new Error("Failed to read file content"));
            }
          };
        });

        fileReader.readAsArrayBuffer(file);
        await pagesPromise.catch((error) => {
          console.error(error);
        });
        setFormData((prevData) => ({
          ...prevData,
          numberOfSlides:
            pages !== undefined
              ? Number(prevData.numberOfSlides) + Number(pages)
              : Number(prevData.numberOfSlides),
        }));
        return {
          id: uniqueId,
          name: originalFileName,
          url: downloadURL,
          totalPages: pages ? pages : 0,
        };
      });

      const newFiles = await Promise.all(fileUploadPromises);

      setLoading({ ...loading, loading: false, type: "" });

      setFormData((prevData: any) => ({
        ...prevData,
        [e.target.name]: [...prevData[e.target.name], ...newFiles],
      }));

      toast.success("Files uploaded successfully");
    }
  };

  const isPDF = (data: ArrayBuffer): boolean => {
    const arr = new Uint8Array(data).subarray(0, 4);
    const header = Array.from(arr)
      .map((byte) => byte.toString(16))
      .join("")
      .toUpperCase();
    return header === "25504446"; // PDF magic number
  };
  const handleFileDelete = async (fileId: string, type: string) => {
    try {
      // Find the file with the specified fileId
      const fileToDelete =
        type === "source"
          ? formData.sourceFiles.find((file: any) => file.id === fileId)
          : formData.submitFiles.find((file: any) => file.id === fileId);
      if (fileToDelete) {
        // Delete the file from Firebase Storage
        const storageRef = ref(storage, `files/${fileToDelete.id}`);
        await deleteObject(storageRef);

        if (type === "source" && fileToDelete && "totalPages" in fileToDelete) {
          setFormData((prevData: any) => ({
            ...prevData,
            numberOfSlides:
              Number(prevData.numberOfSlides) - Number(fileToDelete.totalPages),
            sourceFiles: prevData.sourceFiles.filter(
              (file: any) => file.id !== fileId
            ),
          }));
        } else {
          setFormData((prevData: any) => ({
            ...prevData,
            submitFiles: prevData.submitFiles.filter(
              (file: any) => file.id !== fileId
            ),
          }));
        }
        setFormData((updatedFormData: any) => {
          updateDocById(sidebarOpen.id, updatedFormData);
          return updatedFormData;
        });

        toast.success("File deleted successfully");
      } else {
        console.error("File not found for deletion");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Error deleting file");
    }
  };
  const handleDownloadFile = (
    fileUrl: string,
    fileId: string,
    fileType: string
  ) => {
    setFormData((prevData: any) => {
      const updatedFiles = prevData[fileType].map((file: any) => {
        return file.id === fileId ? { ...file, status: true } : file;
      });
      return {
        ...prevData,
        [fileType]: updatedFiles,
      };
    });
    setFormData((updatedFormData: any) => {
      updateDocById(sidebarOpen.id, updatedFormData);
      return updatedFormData;
    });

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      toast.error(error.message);
      console.error(error);
      // Handle error accordingly, e.g., show an error message to the user
    }
  };
  const fetchTypesOfJobs = async () => {
    try {
      const typesOfJobsCollection = collection(db, "typesOfJobs");
      const q = query(typesOfJobsCollection);

      const querySnapshot = await getDocs(q);

      const jobs = querySnapshot.docs.map((doc) => doc.data().jobType);
      setTypesOfJobs(jobs);
    } catch (error) {
      console.error("Error fetching types of jobs:", error);
      // Handle error accordingly
    }
  };

  const getJobId = async () => {
    const counterDocRef = doc(db, "counters", "jobCounter");
    const counterDocSnap = await getDoc(counterDocRef);
    let newNum = 0;
    if (counterDocSnap.exists()) {
      newNum = (counterDocSnap.data().lastJobNumber || 1) + 1;
    }
    const newTitleId = `MS-JOB${String(newNum).padStart(5, "0")}`;
    setJobId(newTitleId);
  };
  useEffect(() => {
    if (sidebarOpen?.id?.length > 1) {
      getDocById(sidebarOpen.id);
    }
    getJobId();
    getData();
    fetchTypesOfJobs();
  }, []);
  const handleDeleteJobType = async () => {
    try {
      setLoading({ ...loading, loading: true, type: "jobType" });

      const typesOfJobsCollection = collection(db, "typesOfJobs");
      const querySnapshot = await getDocs(typesOfJobsCollection);
      querySnapshot.forEach(async (doc) => {
        if (doc.data().jobType === selectedTypeOfWork) {
          await deleteDoc(doc.ref);
        }
      });

      setTypesOfJobs((prevTypes) =>
        prevTypes.filter((jobType) => jobType !== selectedTypeOfWork)
      );
      setModeOfWork(null);
      setLoading({ ...loading, loading: false, type: "" });
    } catch (error) {
      console.error("Error deleting job type:", error);
      setModeOfWork(null);
      setLoading({ ...loading, loading: false, type: "" });
      // Handle error accordingly
    }
  };

  const handleTickButtonClick = async () => {
    // Step 2: Handle tick button click to add the new type of work to typesOfJobs
    if (newTypeOfWork.trim() !== "") {
      // Add the new type of work to the Firebase collection
      try {
        setLoading({ ...loading, loading: true, type: "jobType" });
        const typesOfJobsCollection = collection(db, "typesOfJobs");
        await addDoc(typesOfJobsCollection, { jobType: newTypeOfWork.trim() });
      } catch (error) {
        console.error("Error adding new type of work:", error);
        setLoading({ ...loading, loading: false, type: "" });
        // Handle error accordingly
      }

      setTypesOfJobs((prevTypes) => [...prevTypes, newTypeOfWork.trim()]);
      setNewTypeOfWork(""); // Clear the input field after adding
      setModeOfWork(null); // Stop adding a new type of work
      setLoading({ ...loading, loading: false, type: "" });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading({ ...loading, loading: true, type: "main" });
    try {
      // Fetch the current job counter
      const counterDocRef = doc(db, "counters", "jobCounter");
      const counterDocSnap = await getDoc(counterDocRef);

      const { ...formDataWithoutFiles } = formData;

      // If updating an existing task
      if (sidebarOpen?.id?.length > 1) {
        await updateDocById(sidebarOpen.id, {
          ...formDataWithoutFiles,
          // titleId: newTitleId,
        });
      } else {
        let lastJobNumber = 1;

        if (counterDocSnap.exists()) {
          lastJobNumber = counterDocSnap.data().lastJobNumber || 1;
        }

        // Construct the new title ID
        const newJobNumber = lastJobNumber + 1;
        const newTitleId = `MS-JOB${String(newJobNumber).padStart(5, "0")}`;
        // If adding a new task
        const docRef = await addDoc(collection(db, "tasks"), {
          ...formDataWithoutFiles,
          createdAt: serverTimestamp(),
          // timer: addValueTime().timer,
          // startDate: addValueTime().startTime,
          titleId: newTitleId,
        });

        // Update the task document with the newly created ID
        await updateDoc(docRef, {
          docId: docRef.id,
        });
        await setDoc(counterDocRef, { lastJobNumber: newJobNumber });
      }

      // Update the job counter

      updateTaskData();
      setLoading({ ...loading, loading: false, type: "" });

      // Close the modal
      setSidebarOpen((prevSidebarState) => ({
        ...prevSidebarState,
        isOpen: !prevSidebarState.isOpen,
        id: "",
      }));
    } catch (error: any) {
      toast.error(error);
      setLoading({ ...loading, loading: false, type: "" });
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
            onClose={() => console.log("first")}
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
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[1000px] sm:min-h-auto sm:px-16 sm:py-8">
                    {loading.loading && loading.type === "main" ? (
                      <div className="flex w-full justify-center items-center min-h-[50vh]">
                        {" "}
                        <LoaderComp />
                      </div>
                    ) : (
                      <>
                        <div className="mt-1 text-center sm:my-1 ">
                          <Dialog.Title
                            as="h1"
                            className="text-[32px] font-bold leading-6 text-gray-900  pb-6"
                          >
                            {sidebarOpen?.id?.length > 1
                              ? "Update Job Sheet"
                              : "Create Job Sheet"}
                          </Dialog.Title>
                          <div className="mt-2 text-[20px]">
                            <form onSubmit={handleSubmit}>
                              <div className="mt-2 flex flex-col grid grid-cols-2 gap-20 items-start">
                                <div className="w-full flex flex-col gap-y-[20px]">
                                  <div>
                                    <label
                                      htmlFor="jobId"
                                      className="flex ml-1.5 text-lg font-medium leading-6 text-gray-900"
                                    >
                                      Job Id
                                    </label>
                                    <div className="mt-2">
                                      <input
                                        type="jobId"
                                        name="jobId"
                                        value={jobId}
                                        disabled
                                        id="jobId"
                                        className="block w-full text-md rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg sm:leading-6"
                                        placeholder="you@example.com"
                                      />
                                    </div>
                                  </div>
                                  {/* <label className="w-full flex">
                                      Task Title:
                                      <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        requi\
                                        className="ml-5 border "
                                        disabled={isUserEmployee()}
                                      />
                                    </label> */}

                                  <div>
                                    {loading.loading &&
                                    loading.type === "jobType" ? (
                                      <div className="max-h-[68px] py-2 flex justify-center w-full">
                                        <LoaderComp height="55" />{" "}
                                      </div>
                                    ) : (
                                      <label className="flex justify-between text-lg font-medium leading-6 text-gray-900">
                                        Type of Work:
                                        <div className="flex">
                                          {!isUserEmployee() &&
                                            modeOfWork === "add" && (
                                              <>
                                                <button
                                                  type="button"
                                                  className="ml-2 hover:bg-green-500 hover:text-white text-black px-2 py-1 rounded"
                                                  onClick={
                                                    handleTickButtonClick
                                                  }
                                                >
                                                  ✓
                                                </button>
                                                <button
                                                  type="button"
                                                  className="ml-2 hover:bg-red-500 hover:text-white text-black px-2 py-1 rounded"
                                                  onClick={() =>
                                                    setModeOfWork(null)
                                                  }
                                                >
                                                  x
                                                </button>
                                              </>
                                            )}
                                          {!isUserEmployee() &&
                                            modeOfWork === "edit" && (
                                              <>
                                                <TrashIcon
                                                  title="Delete File"
                                                  style={{
                                                    height: "25px",
                                                    width: "25px",
                                                    cursor: "pointer",
                                                    color: "red",
                                                  }}
                                                  className="color-red-500 rounded-full p-1 hover:scale-125"
                                                  onClick={handleDeleteJobType}
                                                />
                                                <XMarkIcon
                                                  title="Cancel"
                                                  style={{
                                                    height: "25px",
                                                    width: "25px",
                                                    cursor: "pointer",
                                                    color: "black",
                                                  }}
                                                  className="color-gray-500 rounded-full p-1 hover:scale-125"
                                                  onClick={() =>
                                                    setModeOfWork(null)
                                                  }
                                                />
                                              </>
                                            )}
                                          {!isUserEmployee() &&
                                            modeOfWork === null && (
                                              <>
                                                <PlusIcon
                                                  title="Add type of job"
                                                  style={{
                                                    height: "30px",
                                                    width: "30px",
                                                    cursor: "pointer",
                                                    color: "blue",
                                                  }}
                                                  className="hover:scale-125 rounded-full p-1 ml-2"
                                                  onClick={() =>
                                                    setModeOfWork("add")
                                                  }
                                                />
                                                <PencilSquareIcon
                                                  title="Edit type of job"
                                                  style={{
                                                    height: "30px",
                                                    width: "30px",
                                                    cursor: "pointer",
                                                    color: "blue",
                                                  }}
                                                  className="hover:scale-125 rounded-full p-1 ml-2"
                                                  onClick={() => {
                                                    setModeOfWork("edit");
                                                  }}
                                                />
                                              </>
                                            )}
                                        </div>
                                      </label>
                                    )}
                                    {modeOfWork === "add" ? ( // Step 5: Show input field and tick button when adding a new type of work
                                      <>
                                        <input
                                          type="text"
                                          name="newTypeOfWork"
                                          value={newTypeOfWork}
                                          onChange={handleInputChange}
                                          className="block mt-2 w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg sm:leading-6"
                                          placeholder="Enter new type of work"
                                        />
                                      </>
                                    ) : modeOfWork === "edit" ? (
                                      <>
                                        <select
                                          name="deleteTypeOfWork"
                                          value={selectedTypeOfWork}
                                          onChange={handleInputChange}
                                          required
                                          className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-lg sm:leading-6"
                                          disabled={isUserEmployee()}
                                        >
                                          {formData.typeOfWork === "" && (
                                            <option value="">
                                              Select Type of Work to Delete
                                            </option>
                                          )}
                                          {typesOfJobs.map((jobType, index) => (
                                            <option
                                              key={jobType + index}
                                              value={jobType}
                                            >
                                              {jobType}
                                            </option>
                                          ))}
                                        </select>
                                      </>
                                    ) : (
                                      <>
                                        <select
                                          name="typeOfWork"
                                          value={formData.typeOfWork}
                                          onChange={handleInputChange}
                                          required
                                          className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-lg sm:leading-6"
                                          disabled={isUserEmployee()}
                                        >
                                          {formData.typeOfWork === "" && (
                                            <option value="">
                                              Select Type of Work
                                            </option>
                                          )}
                                          {typesOfJobs.map((jobType, index) => (
                                            <option
                                              key={jobType + index}
                                              value={jobType}
                                            >
                                              {jobType}
                                            </option>
                                          ))}
                                        </select>
                                      </>
                                    )}
                                  </div>

                                  <div>
                                    <label className="flex text-lg font-medium leading-6 text-gray-900">
                                      Job Status:
                                    </label>

                                    <select
                                      name="jobStatus"
                                      value={formData.jobStatus}
                                      onChange={handleInputChange}
                                      className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-lg sm:leading-6"
                                    >
                                      {Object.entries(statusOptions).map(
                                        ([value, label]) => (
                                          <option key={value} value={value}>
                                            {label}
                                          </option>
                                        )
                                      )}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="flex text-lg font-medium leading-6 text-gray-900">
                                      Employee to be assigned:
                                    </label>

                                    <select
                                      name="employeeAssigned"
                                      value={formData.employeeAssigned}
                                      onChange={handleInputChange}
                                      className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-lg sm:leading-6"
                                      disabled={isUserEmployee()}
                                    >
                                      <option value="">Select Employee</option>
                                      {list.map((employee, index) => (
                                        <option
                                          key={employee.displayName + index}
                                          value={employee.displayName}
                                        >
                                          {employee.displayName}
                                        </option>
                                      ))}{" "}
                                      {/* Add more options as needed */}
                                    </select>
                                  </div>

                                  <div className="flex  gap-x-16"></div>
                                </div>
                                <div className="w-full flex flex-col gap-y-[20px] ">
                                  {/* <label className="w-full flex">
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
                                    </label> */}
                                  <div>
                                    <label className="flex text-lg font-medium leading-6 text-gray-900">
                                      PP (1 PP = 6 mins):
                                    </label>

                                    <input
                                      type="number"
                                      name="pp"
                                      value={formData.pp}
                                      onChange={handleInputChange}
                                      required
                                      min="1"
                                      disabled={isUserEmployee()}
                                      className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-lg sm:leading-6"
                                    />
                                  </div>
                                  <div>
                                    <label className="flex text-lg font-medium leading-6 text-gray-900">
                                      Number of Pages:
                                    </label>

                                    <input
                                      type="number"
                                      name="numberOfSlides"
                                      value={formData.numberOfSlides}
                                      onChange={handleInputChange}
                                      required
                                      // min="1"
                                      className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-lg sm:leading-6"
                                      disabled={isUserEmployee()}
                                    />
                                  </div>
                                  <div>
                                    <label className="flex text-lg font-medium leading-6 text-gray-900">
                                      Deadline :
                                    </label>
                                    <input
                                      type="datetime-local"
                                      name="deadline"
                                      value={formData.deadline}
                                      onChange={handleInputChange}
                                      className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-lg sm:leading-6"
                                      disabled={isUserEmployee()}
                                    />
                                  </div>
                                  <div>
                                    <label className="flex text-lg font-medium leading-6 text-gray-900">
                                      Instructions:
                                    </label>

                                    <textarea
                                      name="instructions"
                                      value={formData.instructions}
                                      onChange={handleTextareaChange}
                                      disabled={isUserEmployee()}
                                      className="mt-2 block w-full min-h-[100px] rounded-md border-0 py-1.5 pl-3 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                  </div>
                                </div>
                              </div>

                              {
                                <div className="flex flex-col gap-x-8">
                                  <label className="w-fit min-w-[109px] text-lg mb-4 font-medium leading-6 text-gray-900 flex items-center text-left">
                                    Source Files:
                                    {/* {formData.sourceFiles.length > 0 &&
                                      formData.sourceFiles[0].totalPages && (
                                        <span className="ml-2 text-sm text-gray-600">
                                          (
                                          {formData.sourceFiles.reduce(
                                            (totalPages, file) =>
                                              file.totalPages
                                                ? totalPages + file.totalPages
                                                : totalPages,
                                            0
                                          )}{" "}
                                          pages)
                                        </span>
                                      )} */}
                                  </label>

                                  {loading.loading &&
                                  loading.type === "sourceFiles" ? (
                                    <div className="max-h-[68px] py-2  flex justify-center w-full">
                                      <LoaderComp height="35" /> Please wait,
                                      the file is being uploaded.
                                    </div>
                                  ) : (
                                    <>
                                      {!isUserEmployee() && (
                                        <input
                                          type="file"
                                          name="sourceFiles"
                                          ref={sourceFileInputRef}
                                          onChange={handleFileUpload}
                                          multiple
                                          className="ml-5 border my-1 hidden opacity-0 h-8 w-8"
                                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                          disabled={isUserEmployee()}
                                        />
                                      )}
                                      {formData.sourceFiles.length > 0 ? (
                                        <div className="flex gap-x-[20px]">
                                          <ul className="list-disc w-full">
                                            {formData.sourceFiles.map(
                                              (file, index) => (
                                                <li
                                                  key={index}
                                                  className="flex items-start "
                                                >
                                                  {!isUserEmployee() ? (
                                                    <a
                                                      href={file.url}
                                                      target="_blank"
                                                      title={`${file.name}`}
                                                      rel="noopener noreferrer"
                                                      className="file-link hover:underline text-start  pr-2 overflow-hidden  max-w-[95%] hover:text-blue-500"
                                                    >
                                                      {file.name}
                                                    </a>
                                                  ) : (
                                                    <span
                                                      title={`${file.name}`}
                                                      className={`file-link  text-start max-w-[95%]   overflow-hidden  ${
                                                        file.status
                                                          ? "text-purple-800"
                                                          : ""
                                                      }`}
                                                    >
                                                      {file.name}{" "}
                                                      {formData.sourceFiles
                                                        .length > 0 &&
                                                        formData.sourceFiles[0]
                                                          .totalPages && (
                                                          <span className="ml-2 text-sm text-gray-600">
                                                            ({file.totalPages}
                                                            pages)
                                                          </span>
                                                        )}
                                                    </span>
                                                  )}
                                                  {!isUserEmployee() ? (
                                                    <>
                                                      <TrashIcon
                                                        title="Delete File"
                                                        style={{
                                                          height: "22px",
                                                          width: "22px",
                                                          cursor: "pointer",
                                                          color: "red",
                                                        }}
                                                        className="color-red-500 rounded-full  hover:scale-125"
                                                        onClick={() =>
                                                          handleFileDelete(
                                                            file.id,
                                                            "source"
                                                          )
                                                        }
                                                      />
                                                      {index === 0 && (
                                                        <PlusIcon
                                                          title="Add file"
                                                          className="hover:scale-125"
                                                          style={{
                                                            height: "18px",
                                                            width: "18px",
                                                            cursor: "pointer",
                                                            color: "blue",
                                                          }}
                                                          onClick={() => {
                                                            if (
                                                              sourceFileInputRef.current
                                                            ) {
                                                              sourceFileInputRef.current.click();
                                                            }
                                                          }}
                                                        />
                                                      )}
                                                    </>
                                                  ) : (
                                                    <>
                                                      <ArrowDownTrayIcon
                                                        title="Add file"
                                                        className="hover:scale-125 pl-2"
                                                        style={{
                                                          height: "32px",
                                                          width: "32px",
                                                          cursor: "pointer",
                                                          color: "blue",
                                                        }}
                                                        onClick={() =>
                                                          handleDownloadFile(
                                                            file.url,
                                                            file?.id,
                                                            "sourceFiles"
                                                          )
                                                        }
                                                      />
                                                    </>
                                                  )}
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      ) : (
                                        <span
                                          className="border text-[16px] p-1  max-w-[120px] cursor-pointer hover:bg-gray-200 rounded-lg"
                                          onClick={() => {
                                            if (sourceFileInputRef.current) {
                                              sourceFileInputRef.current.click();
                                            }
                                          }}
                                        >
                                          {/* Customize the appearance of the label */}
                                          Choose Files
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              }

                              <div className="flex flex-col mt-8 ">
                                <label className="w-fit min-w-[109px] mb-4  text-lg font-medium leading-6 text-gray-900 flex items-center text-left ">
                                  Submit Files:
                                </label>

                                {loading.loading &&
                                loading.type === "submitFiles" ? (
                                  <div className="max-h-[68px] py-2 flex justify-center w-full">
                                    <LoaderComp height="55" /> Please wait, the
                                    file is being uploaded.
                                  </div>
                                ) : (
                                  <>
                                    <input
                                      type="file"
                                      name="submitFiles"
                                      ref={submitFileInputRef}
                                      onChange={handleFileUpload}
                                      multiple
                                      className="ml-5 border my-1 hidden opacity-0 h-8 w-8"
                                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                    />
                                    {formData.submitFiles.length > 0 ? (
                                      <div className="flex gap-x-[20px]">
                                        <ul>
                                          {formData.submitFiles.map(
                                            (file, index) => (
                                              <li
                                                key={index}
                                                className="flex items-start"
                                              >
                                                <a
                                                  href={file.url} // Assuming 'url' is the property containing the file URL
                                                  target="_blank"
                                                  title={`${file.name}`}
                                                  rel="noopener noreferrer"
                                                  className="file-link  text-start max-w-[95%] hover:underline hover:text-blue-500"
                                                >
                                                  {file.name}
                                                  {/* {file.name.length > 22
                                                        ? file.name.substring(
                                                            0,
                                                            22
                                                          ) + "..."
                                                        : file.name} */}
                                                </a>

                                                {!isDate24HoursAgo(
                                                  formData.endDate
                                                ) && (
                                                  <>
                                                    <TrashIcon
                                                      title="Delete file"
                                                      style={{
                                                        height: "25px",
                                                        width: "25px",
                                                        cursor: "pointer",
                                                        color: "red",
                                                      }}
                                                      className="color-red-500 rounded-full p-1 hover:scale-125"
                                                      onClick={() =>
                                                        handleFileDelete(
                                                          file.id,
                                                          "submit"
                                                        )
                                                      }
                                                    />
                                                    {index === 0 && (
                                                      <PlusIcon
                                                        title="Add file"
                                                        className="hover:scale-125"
                                                        style={{
                                                          height: "18px",
                                                          width: "18px",
                                                          cursor: "pointer",
                                                          color: "blue",
                                                        }}
                                                        onClick={() => {
                                                          if (
                                                            submitFileInputRef.current
                                                          ) {
                                                            submitFileInputRef.current.click();
                                                          }
                                                        }}
                                                      />
                                                    )}
                                                  </>
                                                )}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    ) : (
                                      <span
                                        className="border text-[16px]  max-w-[120px] p-1 cursor-pointer hover:bg-gray-200 rounded-lg"
                                        onClick={() => {
                                          if (submitFileInputRef.current) {
                                            submitFileInputRef.current.click();
                                          }
                                        }}
                                      >
                                        {/* Customize the appearance of the label */}
                                        Choose Files
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="flex w-full gap-x-20 ">
                                <button
                                  title="Submit"
                                  type="submit"
                                  disabled={loading.loading}
                                  // onClick={() => {
                                  //   if (formData.jobStatus === "inprogress")
                                  //     setFormData((prevData: any) => ({
                                  //       ...prevData,
                                  //       timer: addValueTime().timer,
                                  //       startDate: addValueTime().startTime,
                                  //     }));
                                  // }}
                                  className={`w-[50%] mt-8 ${
                                    loading.loading
                                      ? `cursor-not-allowed`
                                      : `cursor-pointer`
                                  } justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
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
