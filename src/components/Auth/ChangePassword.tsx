import React, { useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
interface ChangePasswordProps {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setModal: React.Dispatch<React.SetStateAction<boolean>>;
}
const ChangePassword: React.FC<ChangePasswordProps> = ({
  loading,
  setLoading,
  setModal,
}) => {
  const { changePassword, currentUser } = useAuth();
  const passwordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (passwordRef.current && newPasswordRef.current) {
      if (passwordRef.current.value !== newPasswordRef.current.value) {
        return setError("Password do not match");
      }
    }

    try {
      setError("");
      setLoading(true);
      if (newPasswordRef.current) {
        await changePassword(newPasswordRef.current.value);
        toast.success("Password Changed Successfully");
        setModal(false);
      }
    } catch (error: any) {
      console.log(error);
      toast.error(error.toString());
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-1 flex-col justify-center py-6 ">
      <div className=" sm:w-full sm:max-w-md">
        <h2 className="text-start text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Change Password
        </h2>
      </div>

      <div className="mt-10  sm:w-full sm:max-w-[360px]">
        <div className="bg-white px-3 py-12 shadow sm:rounded-lg sm:px-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="py-3">
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
                  required
                  ref={passwordRef}
                  className="block p-3 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="py-3">
              <label
                htmlFor="confirmPassword"
                className="block text-sm  font-medium leading-6 text-gray-900"
              >
                Confirm Password
              </label>
              <div className="mt-2">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  ref={newPasswordRef}
                  className="block w-full p-3 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm ${
                  loading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-indigo-500"
                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
