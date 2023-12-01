import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
// import DashboardPage from './pages/DashboardPage';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import SignUpPage from './pages/SignUpPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardPage from './pages/DashboardPage';
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
        
      <Route path="/" element={<DashboardPage />} />

        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
      </Routes>
    </AuthProvider>

    </Router>
    </>

  );
};

export default App;
