import React, { useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import LoaderComp from "../components/Loader";
import axios from "axios";

export function useAuth() {
  return useContext(AuthContext);
}

const AuthContext = React.createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();

  const [loading, setLoading] = useState(true);

  function signUp(email, password, name) {
    // Create a new user with email and password
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // User has been successfully created
        const user = userCredential.user;
        // Add roles for the user

        return user;
      })
      .catch((error) => {
        // Handle errors during user creation
        console.error("Error creating user:", error);
        throw error;
      });
  }

 
   async function login (email, password) {
    const userDetails = await signInWithEmailAndPassword(auth, email, password)
    ;
    // await getDetails(userDetails.user.uid)

  }

  function logout() {
    return signOut(auth)
      .then(() => {
        setCurrentUser(null); // Set currentUser to null on successful sign-out
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }



  const getDetails = async(uid)=>{
    const response = await axios.get(
      ` ${process.env.REACT_APP_API_URL}/getUserInfo/${uid}`,
    );
    setCurrentUser(response.data)
  }
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        getDetails(user.uid)

        // setCurrentUser(user);
      } 
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signUp,
    login,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className=" p-56 justify-center items-center">
          {" "}
          <LoaderComp />{" "}
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
