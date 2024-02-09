import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function ForgetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const { currentUser } = useAuth();


  const { resetPassword } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);


  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setErrorMessage("");
      setLoading(true);
      if (email ) {
        await resetPassword(email);
        toast.success("Check your inbox for further instructions");
        // navigate("/");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to reset");
      setErrorMessage("Failed to reset");
    }

    setLoading(false);
  };

  // Clear error message when input changes
  const handleInputChange = () => {
    setErrorMessage("");
  };
  return (
    <div>
      <>
        <div className="flex min-h-full flex-1">
          <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
            <div className="mx-auto w-full max-w-sm lg:w-96">
              <div>
                <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-gray-900">
                  Password Reset
                </h2>
              </div>

              <div className="mt-10">
                <div>
                  <form onSubmit={handleReset} className="space-y-6">
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
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={handleInputChange}
                          className="block w-full p-3 rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="text-red-500 text-sm mt-2">
                        {errorMessage}
                      </div>
                    )}

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
                        {loading ? "Reseting Password..." : "Reset Password"}
                      </button>
                    </div>
                  </form>
                </div>
                {/* <p className="p-4 flex w-full justify-center">
                Need an account?{" "}
                <Link to="/signup" className="text-blue-500 px-3 ">
                  {" "}
                  Sign Up
                </Link>
              </p> */}
              </div>
            </div>
          </div>
        </div>
      </>
    </div>
  );
}
