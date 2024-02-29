import React, {
  Dispatch,
  Fragment,
  SetStateAction,
  useRef,
  useState,
} from "react";
import { Dialog, Transition } from "@headlessui/react";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";
import { db } from "../../firebase/firebase";
import LoaderComp from "../Loader";
import { AddModalState } from "../../types";
import { TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { countPDFPages, isPDF } from "./AddTaskDrawer";

interface AddEmployeeProps {
  modalState: AddModalState;
  setModalState: Dispatch<SetStateAction<AddModalState>>;
  updateTaskData: () => void;
}

interface SelectedFile {
  file: File;
  filename: string;
  totalPages: number;
  downloadUrl?: string;
}

const UploadFiles: React.FC<AddEmployeeProps> = ({
  modalState,
  setModalState,
  updateTaskData,
}) => {
  const uploadFileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError("Please select at least one file.");
      return;
    }
    try {
      setLoading(true);
      const promises = selectedFiles.map(async (fileObj) => {
        const { file, filename } = fileObj;
        const storage = getStorage();
        const originalFileName = filename;
        const timestamp = Date.now();
        const uniqueId = `${originalFileName}_${timestamp}`;
        const fileId = `${uniqueId}`;
        const storageRef = ref(storage, `files/${fileId}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        return { ...fileObj, downloadUrl, uniqueId };
      });
      const uploadedFiles = await Promise.all(promises);
      const intakeFilesCollection = collection(db, "IntakeFiles");
      uploadedFiles.forEach(async (fileObj) => {
        const { filename, totalPages, downloadUrl, uniqueId } = fileObj;
        await addDoc(intakeFilesCollection, {
          file_name: filename,
          total_pages: totalPages,
          file_id: uniqueId,
          url: downloadUrl,
        });
      });
      setSelectedFiles([]);
      setLoading(false);
      setModalState((prev) => ({
        ...prev,
        isOpen: false,
      }));
      toast.success("Files uploaded successfully");
      updateTaskData()
      setError("");
    } catch (error) {
      console.error("Error adding files to Firebase:", error);
      toast.error("Error adding files to Firebase");
      setError("Failed to upload files. Please try again later.");
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files);

      const updatedSelectedFiles = await Promise.all(
        fileList.map(async (file) => {
          let totalPages = 0;
          const fileContent = await readFileAsArrayBuffer(file);
          if (isPDF(fileContent)) {
            try {
              totalPages = await countPDFPages(file);
            } catch (error) {
              console.error("Error counting PDF pages:", error);
            }
          }
          return {
            file,
            filename: file.name,
            totalPages,
          };
        })
      );

      setSelectedFiles((prevSelectedFiles) => [
        ...updatedSelectedFiles,
        ...prevSelectedFiles,
      ]);
      setError("");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  let isDropHandled = false; // Flag to track if drop event has been handled

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Check if drop event has already been handled
    if (isDropHandled) {
      return;
    }

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles) {
      isDropHandled = true; // Set flag to true to indicate drop event is handled

      const fileList = Array.from(droppedFiles);

      const updatedSelectedFiles = await Promise.all(
        fileList.map(async (file) => {
          let totalPages = 0;
          const fileContent = await readFileAsArrayBuffer(file);
          if (isPDF(fileContent)) {
            try {
              totalPages = await countPDFPages(file);
              console.log("first", totalPages);
            } catch (error) {
              console.error("Error counting PDF pages:", error);
            }
          }
          return {
            file,
            filename: file.name,
            totalPages,
          };
        })
      );

      setSelectedFiles((prevSelectedFiles) => [
        ...updatedSelectedFiles,
        ...prevSelectedFiles,
      ]);
      setError("");
    }
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file as ArrayBuffer"));
        }
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <>
      <Transition.Root show={modalState.isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => console.log("first")}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>

            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block w-full max-w-4xl overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                {loading ? (
                  <div className="flex w-full flex-col  justify-center items-center min-h-[50vh]">
                    {" "}
                    <LoaderComp />
                    <span className="py-10">
                      {" "}
                      Please wait, files are being uploaded...
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="flex justify-between p-6 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">
                        Upload Files
                      </h3>
                      <button
                        type="button"
                        title="Close"
                        className="text-gray-400 hover:text-gray-500 hover:scale-110 focus:outline-none focus:text-gray-500"
                        onClick={() =>
                          setModalState((prev) => ({
                            ...prev,
                            isOpen: false,
                          }))
                        }
                      >
                        <span className="sr-only" title="Close">
                          Close
                        </span>
                        <svg
                          className="w-6 h-6"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex w-full justify-end ">
                      <input
                        type="file"
                        name="sourceFiles"
                        ref={uploadFileInputRef}
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                      />
                    </div>
                    <div
                      className="px-4 py-5 space-y-6 max-h-[60vh] overflow-y-auto"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
                          {error}
                        </div>
                      )}

                      {selectedFiles.length > 0 ? (
                        selectedFiles.map((fileObj, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 border-b border-gray-200"
                          >
                            <div className="flex items-center gap-x-4">
                              <span
                                className="flex-1 break-all"
                                title={fileObj.filename}
                              >
                                {fileObj.filename}
                              </span>
                              <input
                                type="number"
                                className="w-12 ml-2 shadow-sm focus:ring-indigo-500 text-center focus:border-indigo-500 block sm:text-base border-gray-300 rounded-md"
                                placeholder="Total Pages"
                                value={fileObj.totalPages}
                                onChange={(e) => {
                                  const updatedFiles = [...selectedFiles];
                                  updatedFiles[index].totalPages = Number(
                                    e.target.value
                                  );
                                  setSelectedFiles(updatedFiles);
                                }}
                              />
                              <TrashIcon
                                className="w-5 h-5 text-red-600 cursor-pointer hover:scale-110"
                                onClick={() => {
                                  const updatedFiles = [...selectedFiles];
                                  updatedFiles.splice(index, 1);
                                  setSelectedFiles(updatedFiles);
                                }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          className="px-4 py-2 border-b border-gray-200 flex flex-col w-full justify-center min-h-[140px] items-center"
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        >
                          {" "}
                          No Files Selected
                          <span className="text-gray-500">
                            (Choose Files or Drag and Drop files here)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="px-7 py-5 justify-between flex w-full">
                      <button
                        type="button"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => uploadFileInputRef.current?.click()}
                      >
                        Choose Files
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        disabled={loading}
                      >
                        {loading ? "Uploading..." : "Upload"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default UploadFiles;
