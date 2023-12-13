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
  name: string;
  role: string;
}
const AddTaskDrawer: React.FC<AddTaskDrawerProps> = ({
  sidebarOpen,
  setSidebarOpen,
  updateTaskData,
  userDetails,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    numberOfSlides: 1,
    typeOfWork: "",
    pp: 1,
    employeeAssigned: "",
    startDate: "",
    endDate: "",
    deadline: "",
    files: [],
    instructions: "",
    jobStatus: "unassigned",
  });
  const [list, setList] = useState<rolesApi[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { getUserRoles } = useAuth();
  const formattedDate = (date: any) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const isoString = `${year}-${month}-${day}T${hours}:${minutes}`;
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
      const endDate = new Date();
      const ppValue = formData.pp.toString();
      endDate.setMinutes(endDate.getMinutes() + parseInt(ppValue, 10) * 6);
      setFormData((prevData) => ({
        ...prevData,
        startDate: formattedDate(currentDate),
        endDate: formattedDate(endDate),
      }));
    }
    if (
      name === "jobStatus" &&
      (value === "completed" || value === "handover")
    ) {
      const currentDate = new Date();

      const endDate = new Date();
      if (formattedDate(currentDate) < formData.endDate) {
        console.log("first12", formData.endDate);

        const ppValue = formData.pp.toString();
        endDate.setMinutes(endDate.getMinutes() + parseInt(ppValue, 10) * 6);
        setFormData((prevData) => ({
          ...prevData,
          endDate: formattedDate(currentDate),
        }));
      }
    }
    if (
      name === "jobStatus" &&
      (value === "unassigned" || value === "notstarted")
    ) {
      setFormData((prevData) => ({
        ...prevData,
        startDate: "",
        endDate: "",
      }));
    }
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
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileUploadPromises = Array.from(files).map(async (file: File) => {
        const filename = `${file.name}`;
        const storageRef = ref(storage, `files/${filename}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            setLoading(true);
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
            switch (snapshot.state) {
              case "paused":
                console.log("Upload is paused");
                break;
              case "running":
                console.log("Upload is running");
                break;
            }
          },
          (error) => {
            console.error("Error during file upload:", error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("File available at", downloadURL);
            if (downloadURL) {
              setLoading(false);
              toast.success("File uploaded successfully");
            }
            setFormData((prevData: any) => ({
              ...prevData,
              files: arrayUnion(downloadURL),
            }));
          }
        );
      });
    }
  };
  const storage = getStorage();
  const getData = async () => {
    const val = await getUserRoles();
    setList(val);
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
      const { ...formDataWithoutFiles } = formData;
      if (sidebarOpen?.id?.length > 1) {
        await updateDocById(sidebarOpen.id, {
          ...formDataWithoutFiles,
        });
      } else {
        const docRef = await addDoc(collection(db, "tasks"), {
          ...formDataWithoutFiles,
          createdAt: serverTimestamp(),
        });
        await updateDoc(docRef, {
          docId: docRef.id,
        });
      }
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
                                ? "Update Task"
                                : "Add task"}
                            </Dialog.Title>
                            <div className="mt-2 text-[20px]">
                              <form onSubmit={handleSubmit}>
                                <div className="mt-2 flex flex-col grid grid-cols-2 gap-4 items-start">
                                  <div className="w-full flex flex-col gap-y-[20px]">
                                    <label className="w-full flex">
                                      Task Title:
                                      <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="ml-5 border "
                                        disabled={isFieldDisabled()}
                                      />
                                    </label>
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
                                            key={employee.name}
                                            value={employee.name}
                                          >
                                            {employee.name}
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

                                    <label className="w-full flex">
                                      Files:
                                      <input
                                        type="file"
                                        name="files"
                                        onChange={handleFileUpload}
                                        multiple
                                        className="ml-5 border my-1"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                                        disabled={isFieldDisabled()}
                                      />
                                    </label>
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
                                    type="submit"
                                    className=" w-[50%] mt-8 justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                  >
                                    {sidebarOpen?.id?.length > 1
                                      ? "Update Task"
                                      : "Add task"}
                                  </button>
                                  {/* <div className="mt-5 sm:mt-6"> */}
                                  <button
                                    type="button"
                                    className=" w-[50%] justify-center rounded-md bg-red-600 mt-8 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
