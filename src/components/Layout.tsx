import React, { ReactNode } from 'react';
import SideBar from './SideBar';
interface LayoutProps {
    children: ReactNode;
  }
const Layout: React.FC <LayoutProps>= ({ children }) => {
  return (
    <div className=" w-full flex h-screen bg-gray-100">
        <div className='w-[15%] flex'>
      <SideBar />
      </div>
      <div className=" flex w-[85%] overflow-hidden">{children}</div>
    </div>
  );
};

export default Layout;