import React, { useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

export function useAuth() {
  return useContext(AuthContext);
}

const AuthContext = React.createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();

  const [loading, setLoading] = useState(true);

  function signUp(email, password) {
    // Create a new user with email and password
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // User has been successfully created
        const user = userCredential.user;
        // console.log("firstwe31", user);
        // Add roles for the user
        addRoles(email);

        return user;
      })
      .catch((error) => {
        // Handle errors during user creation
        console.error("Error creating user:", error);
        throw error;
      });
  }

  async function addRoles(email) {
    try {
      const docRef = await addDoc(collection(db, "userRoles"), {
        email: email,
        role: "employee",
      });
    } catch (error) {
      console.log(error);
    }
  }
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    console.log("first121");

    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }
  async function getUserRoles() {
    const userRolesCollection = collection(db, "userRoles");

    try {
      const querySnapshot = await getDocs(userRolesCollection);

      querySnapshot.forEach((doc) => {
        // Access data for each document
        const data = doc.data();
        console.log("User Role:", data);
      });
    } catch (error) {
      console.error("Error getting user roles:", error);
    }
  }

  async function getUserRoleByEmail(email) {
    const userRolesCollection = collection(db, "userRoles");

    const q = query(userRolesCollection, where("email", "==", email));

    try {
      const querySnapshot = await getDocs(q);

      if (querySnapshot.size === 0) {
        console.log(`No user role found for email: ${email}`);
        return null;
      }

      // Assuming there's only one document for a unique email
      const doc = querySnapshot.docs[0];
      const userRole = doc.data();
      // console.log("User Role:", userRole)
      return userRole;
    } catch (error) {
      console.error("Error getting user role:", error);
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRole = await getUserRoleByEmail(user.email);

        // Add the role property to the user object
        if (userRole) {
          user.role = userRole.role;
        } else {
          // Set a default role if no user role is found
          user.role = "employee";
        }

        setCurrentUser(user);
      } else {
        setCurrentUser(user);
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
      {!loading && children}
    </AuthContext.Provider>
  );
}
