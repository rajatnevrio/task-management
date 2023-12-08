import React, { ReactNode } from 'react';
import SideBar from './SideBar';
interface LayoutProps {
    children: ReactNode;
  }
const Layout: React.FC <LayoutProps>= ({ children }) => {
  return (
    <div className=" w-full flex h-screen bg-gray-100">
        <div className='w-[15%]'>
      <SideBar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
};

export default Layout;