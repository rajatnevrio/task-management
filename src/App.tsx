import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignInPage from "./pages/SignInPage";
// import DashboardPage from './pages/DashboardPage';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SignUpPage from "./pages/SignUpPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import ForgetPasswordPage from "./pages/ForgetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import Layout from "./components/Layout";
import Employees from "./components/Employees/Employees";
const App: React.FC = () => {
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Router>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <Layout>
                  <DashboardPage />
                </Layout>
              }
            />
            <Route path="/forgot-password" element={<ForgetPasswordPage />} />

            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/completed-jobs"
              element={
                <Layout>
                  <DashboardPage type="completed_jobs" />
                </Layout>
              }
            />
            <Route path="/Profile"   element={
                <Layout>
                  <ProfilePage />
                </Layout>
              } />
              <Route path="/employees"   element={
                <Layout>
                  <Employees type="employee" />
                </Layout>
              } />
               <Route path="/intake-team"   element={
                <Layout>
                  <Employees type="task_creator" />
                </Layout>
              } />
            {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
};

export default App;
