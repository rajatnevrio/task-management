import React, {
  Dispatch,
  Fragment,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { Dialog, Transition } from "@headlessui/react";

import { db } from "../../firebase/firebase";
import { toast } from "react-toastify";
import LoaderComp from "../Loader";
import { AddModalState } from "../../types";
import axios from "axios";
import { getTypeLabel } from "../Employees/Employees";
interface AddEmployeeProps {
  modalState: AddModalState;
  setModalState: Dispatch<SetStateAction<AddModalState>>;
  updateTaskData: () => void;
  type?: string;
}

const AddEmployee: React.FC<AddEmployeeProps> = ({
  modalState,
  setModalState,
  updateTaskData,
  type,
}) => {
  const [passwordChange, setPasswordChange] = useState<boolean>(false);
  const [formValues, setFormValues] = useState({
    email: modalState.details.email ? modalState.details.email : "",
    password: "",
    role: "",
    name: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formValues.password && formValues.confirmPassword) {
      if (formValues.password !== formValues.confirmPassword) {
        return setError("Password do not match");
      }
    }

    try {
      setError("");
      setLoading(true);
      if (modalState.details.displayName.length > 1) {
        await handleUpdateUser();
      }
      if (formValues.email && formValues.password && formValues.name && modalState.details.displayName.length < 1) {
        const response = await axios
          .post(` ${process.env.REACT_APP_API_URL}/createUser`, {
            email: formValues.email,
            password: formValues.password,
            displayName: formValues.name,
            role: type && getTypeLabel(type, "default"),
          })
          .catch((err) => {
            toast.error(err.response.data.error);
            console.log(err.response.data.error);
          });
        updateTaskData();

        if (response) {
          toast.success("user created successfully");
        }
        setModalState((prev) => ({
          ...prev,
          isOpen: !modalState.isOpen,
        }));
      }
    } catch (error) {
      console.log(error);
      if (error && (error as any).code === "auth/email-already-in-use") {
        toast.error("Email is already in use. Please use a different email.");
        setError("Email is already in use. Please use a different email.");
      } else {
        toast.error("Failed to create an account");
        setError("Failed to create an account");
      }
    }

    setLoading(false);
  };
  const handleUpdateUser = async () => {
    try {
      setLoading(true);
      const uid = modalState.details?.uid;
      const displayName = formValues.name;
      const email = formValues.email;
      const role = formValues.role;
      if (passwordChange && formValues.password && formValues.confirmPassword) {
        if (formValues.password !== formValues.confirmPassword) {
          return setError("Password do not match");
        }
      }

      // Make a PUT request to your API endpoint
      const response = await axios
        .put(`${process.env.REACT_APP_API_URL}/updateUser/${uid}`, {
          displayName,
          email,
          role,
          // password,
        })
        .catch((err) => {
          toast.error(err.message);
          console.log(err);
        });

      // Update the employaasigned field in the task documents
      const taskQuerySnapshot = await getDocs(collection(db, "tasks"));

      await Promise.all(
        taskQuerySnapshot.docs.map(async (taskDoc) => {
          const taskData = taskDoc.data();

          const employeeAssigned = taskData?.employeeAssigned;

          if (employeeAssigned === modalState.details?.displayName) {
            await updateDoc(doc(db, "tasks", taskDoc.id), {
              employeeAssigned: displayName,
            });
          }
        })
      );

      setModalState((prev) => ({
        ...prev,
        isOpen: false,
        details: initState,
      }));
      updateTaskData();
      setLoading(false);

      toast.success("User updated successfully");
      // Handle success or update UI accordingly
    } catch (error) {
      setModalState((prev) => ({
        ...prev,
        isOpen: false,
        details: initState,
      }));
      setLoading(false);

      toast.error("Error updating user");
      // Handle error or update UI accordingly
    }
  };

  useEffect(() => {
    if (
      modalState.details &&
      modalState.details.displayName &&
      modalState.details.displayName.length > 1 &&
      modalState.details.role.length > 1
    ) {
      setFormValues((prev) => ({
        ...prev,
        name: modalState?.details?.displayName,
        email: modalState?.details?.email,
        role: modalState?.details?.role,
      }));
    }
    if (type && formValues.role) {
      console.log("first", type);
      setFormValues((prev) => ({
        ...prev,
        role: type === "employee" ? "employee" : "task-creator",
      }));
    }
  }, [modalState.details]);

  const initState = {
    email: "",
    name: "",
    role: "",
    displayName: "",
    uid: "",
  };
  return (
    <>
      {
        <Transition.Root show={modalState.isOpen} as={Fragment}>
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
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                    {loading ? (
                      <div className="flex w-full justify-center items-center min-h-[50vh]">
                        {" "}
                        <LoaderComp />
                      </div>
                    ) : (
                      <>
                        <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
                          <div className="sm:mx-auto sm:w-full sm:max-w-md">
                            <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                              {modalState.details.displayName.length > 1
                                ? "Update"
                                : "Add"}{" "}
                              {type && getTypeLabel(type, "button")}
                            </h2>
                          </div>

                          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                            <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
                              <form
                                className="space-y-6"
                                onSubmit={handleSubmit}
                              >
                                <div>
                                  <label
                                    htmlFor="name"
                                    className="block text-sm font-medium leading-6 text-gray-900"
                                  >
                                    Name
                                  </label>
                                  <div className="mt-2">
                                    <input
                                      id="name"
                                      name="name"
                                      type="name"
                                      autoComplete="name"
                                      required
                                      value={formValues.name}
                                      onChange={(e) =>
                                        setFormValues((prev) => ({
                                          ...prev,
                                          name: e.target.value,
                                        }))
                                      } //
                                      className="block p-3 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label
                                    htmlFor="email"
                                    className="block text-sm font-medium leading-6 text-gray-900"
                                  >
                                    Email address
                                  </label>
                                  <div className="mt-2">
                                    <input
                                      id="email"
                                      name="email"
                                      type="email"
                                      autoComplete="email"
                                      required
                                      value={formValues.email}
                                      onChange={(e) =>
                                        setFormValues((prev) => ({
                                          ...prev,
                                          email: e.target.value,
                                        }))
                                      } //
                                      className="block p-3 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label
                                    htmlFor="role"
                                    className="block text-sm font-medium leading-6 text-gray-900"
                                  >
                                    Role
                                  </label>
                                  <div className="mt-2">
                                    <select
                                      id="role"
                                      name="role"
                                      autoComplete="role"
                                      required
                                      value={formValues.role}
                                      onChange={(e) =>
                                        setFormValues((prev) => ({
                                          ...prev,
                                          role: e.target.value,
                                        }))
                                      } //
                                      className="block p-3 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    >
                                      {/* <option value="">Select Role</option> */}
                                      <option value="task-creator">
                                        Intake
                                      </option>
                                      <option value="employee">Employee</option>
                                    </select>
                                  </div>
                                </div>
                                {modalState.details.displayName.length > 1 && (
                                  <div className="mt-4 flex items-center">
                                    <input
                                      id="changePassword"
                                      name="changePassword"
                                      type="checkbox"
                                      checked={passwordChange}
                                      onChange={() =>
                                        setPasswordChange(!passwordChange)
                                      }
                                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label
                                      htmlFor="changePassword"
                                      className="ml-2 block text-sm text-gray-900 leading-5"
                                    >
                                      Change Password
                                    </label>
                                  </div>
                                )}
                                {(modalState.details.displayName.length < 1 ||
                                  passwordChange) && (
                                  <>
                                    <div>
                                      <label
                                        htmlFor="password"
                                        className="block text-sm font-medium leading-6 text-gray-900"
                                      >
                                        Password
                                      </label>
                                      <div className="mt-2">
                                        <input
                                          id="password"
                                          name="password"
                                          type="password"
                                          autoComplete="new-password"
                                          required={
                                            modalState.details.displayName
                                              .length < 1
                                          }
                                          value={formValues.password}
                                          onChange={(e) =>
                                            setFormValues((prev) => ({
                                              ...prev,
                                              password: e.target.value,
                                            }))
                                          } //
                                          className="block w-full p-3 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label
                                        htmlFor="confirmPassword"
                                        className="block text-sm font-medium leading-6 text-gray-900"
                                      >
                                        Confirm Password
                                      </label>
                                      <div className="mt-2">
                                        <input
                                          id="confirmPassword"
                                          name="confirmPassword"
                                          type="password"
                                          autoComplete="new-password"
                                          required={
                                            modalState.details.displayName
                                              .length < 1
                                          }
                                          value={formValues.confirmPassword}
                                          onChange={(e) =>
                                            setFormValues((prev) => ({
                                              ...prev,
                                              confirmPassword: e.target.value,
                                            }))
                                          } //
                                          className="block w-full p-3 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        />
                                      </div>
                                    </div>
                                  </>
                                )}

                                {error && (
                                  <div className="text-red-500 text-sm mt-2">
                                    {error}
                                  </div>
                                )}

                                <div className="flex flex-col gap-y-4">
                                  <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm ${
                                      loading
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-indigo-500"
                                    } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
                                  >
                                    {loading
                                      ? ` ${
                                          modalState.details.displayName
                                            .length > 0
                                            ? "Updating..."
                                            : "Adding..."
                                        }`
                                      : `${
                                          modalState.details.displayName
                                            .length > 0
                                            ? "Update"
                                            : "Add"
                                        }`}
                                  </button>
                                  <button
                                    type="button"
                                    className="mt-3 inline-flex w-full bg-red-500 text-white hover:text-black mt-6  justify-center rounded-md  px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                                    onClick={() =>
                                      setModalState((prev) => ({
                                        ...prev,
                                        isOpen: false,
                                        details: initState,
                                      }))
                                    }
                                  >
                                    Cancel
                                  </button>
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
export default AddEmployee;
