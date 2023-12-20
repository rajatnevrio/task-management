import React from 'react';
import Employees from '../components/Employees/Employees';

interface EmployePageProps {
  type ? : string
}
const EmployeesPage: React.FC<EmployePageProps> = ({ type}) => {
  return (
    <div>
      <Employees type ={type} />
    </div>
  );
};

export default EmployeesPage;
