import React, { ChangeEvent, Fragment, useState } from "react";
import {
  DocumentReference,
  addDoc,
  arrayUnion,
  collection,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Dialog, Transition } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { DocumentData } from '@firebase/firestore-types';


import { db } from "../firebase/firebase";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";
interface AddTaskDrawerProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
const AddTaskDrawer: React.FC<AddTaskDrawerProps> = ({
  sidebarOpen,
  setSidebarOpen,
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setFormData((prevData: any) => ({
      ...prevData,
      files: files ? Array.from(files) : [],
    }));
  };
  const storage = getStorage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data submitted:", formData);
  
    let docRef: DocumentReference<DocumentData>; // Explicitly define the type
  
    try {
      // Exclude the 'files' field from the form data
      const { files, ...formDataWithoutFiles } = formData;
  
      // Add the form data (excluding 'files') to the "tasks" collection
      docRef = await addDoc(collection(db, "tasks"), {
        ...formDataWithoutFiles,
        createdAt: serverTimestamp(),
      });
  
      console.log("Document written with ID:", docRef.id);
      await updateDoc(docRef, {
        docId: docRef.id,
      });
      // Handle file uploads to Firebase Storage
      if (files && files.length > 0) {
        const fileUploadPromises = files.map(async (file: File) => {
          // Create a unique filename using the document ID and the original filename
          const filename = `${docRef.id}_${file.name}`;
  
          // Create a storage reference with the filename
          const storageRef = ref(storage, `files/${filename}`);
  
          // Upload the file to Firebase Storage using resumable upload
          const uploadTask = uploadBytesResumable(storageRef, file);
  
          // Monitor the upload progress and handle completion
          uploadTask.on(
            "state_changed",
            (snapshot) => {
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
              // Handle successful upload completion
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("File available at", downloadURL);
  
              // Update the Firestore document with the file download URL
              await updateDoc(docRef, {
                files: arrayUnion(downloadURL),
              });
            }
          );
        });
  
        // Wait for all file uploads to complete
        await Promise.all(fileUploadPromises);
      }
  
      // Close the modal
      setSidebarOpen(false);
    } catch (error:any) {
      toast.error(error)
      console.error("Error adding document:", error);
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
    <Transition.Root show={sidebarOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setSidebarOpen}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                <div>
                  <div className="mt-1 text-center sm:my-1 ">
                    <Dialog.Title
                      as="h1"
                      className="text-base font-semibold leading-6 text-gray-900 text-3xl pb-6"
                    >
                      Add task
                    </Dialog.Title>
                    <div className="mt-2 ">
                      <form onSubmit={handleSubmit}>
                        <div className="mt-2 flex flex-col gap-y-3 items-start">
                          <label>
                            Task Title:
                            <input
                              name="title"
                              value={formData.title}
                              onChange={handleInputChange}
                              required
                              className="ml-5"
                            />
                          </label>
                          <label>
                            Number of Slides:
                            <input
                              type="number"
                              name="numberOfSlides"
                              value={formData.numberOfSlides}
                              onChange={handleInputChange}
                              required
                              min="1"
                              className="ml-5"
                            />
                          </label>

                          <label>
                            Type of Work:
                            <select
                              name="typeOfWork"
                              value={formData.typeOfWork}
                              onChange={handleInputChange}
                              required
                              className="ml-5"
                            >
                              {/* Dynamic values for Type of Work */}
                              <option value="">Select Type of Work</option>
                              <option value="design">Design</option>
                              <option value="development">Development</option>
                              {/* Add more options as needed */}
                            </select>
                          </label>

                          <label>
                            PP (1 PP = 6 mins):
                            <input
                              type="number"
                              name="pp"
                              value={formData.pp}
                              onChange={handleInputChange}
                              required
                              min="1"
                              className="ml-5"
                            />
                          </label>

                          <label>
                            Employee to be assigned:
                            <select
                              name="employeeAssigned"
                              value={formData.employeeAssigned}
                              onChange={handleInputChange}
                              className="ml-5"
                            >
                              {/* Dynamic values for Employee to be assigned */}
                              <option value="">Select Employee</option>
                              <option value="john_doe">John Doe</option>
                              <option value="jane_doe">Jane Doe</option>
                              {/* Add more options as needed */}
                            </select>
                          </label>
                          <label>
                            Start Date/Time:
                            <input
                              type="datetime-local"
                              name="startDate"
                              value={formData.startDate}
                              onChange={handleInputChange}
                              className="ml-5"
                            />
                          </label>

                          <label>
                            End Date/Time:
                            <input
                              type="datetime-local"
                              name="endDate"
                              value={formData.endDate}
                              onChange={handleInputChange}
                              className="ml-5"
                            />
                          </label>

                          <label>
                            Deadline Date/Time:
                            <input
                              type="datetime-local"
                              name="deadline"
                              value={formData.deadline}
                              onChange={handleInputChange}
                              className="ml-5"
                            />
                          </label>
                          {/* Other form fields go here */}
                          {/* ... */}

                          <label>
                            Files:
                            <input
                              type="file"
                              name="files"
                              onChange={handleFileUpload}
                              multiple
                              className="ml-5"
                              accept=".pdf,.doc,.docx,.ppt,.pptx"
                            />
                          </label>

                          <label className="flex items-center">
                            Instructions:
                            <textarea
                              name="instructions"
                              value={formData.instructions}
                              onChange={handleTextareaChange}
                              className="ml-5"
                            />
                          </label>

                          <label>
                            Job Status:
                            <select
                              name="jobStatus"
                              value={formData.jobStatus}
                              onChange={handleInputChange}
                              className="ml-5"
                            >
                              <option value="unassigned">Unassigned</option>
                              <option value="notstarted">Not Started</option>
                              <option value="inprogress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="handover">Handover</option>
                            </select>
                          </label>

                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          >
                            Add task
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
export default AddTaskDrawer;
