import React from "react";
import Dashboard from "../components/Dashboard/Dashboard";

interface DashboardPageProps {
  type?: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ type }) => {
  return (
    <>
      <Dashboard type={type} />
    </>
  );
};

export default DashboardPage;
