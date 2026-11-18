import React from 'react';
import AppSidebar from './AppSidebar';

export default function AppLayout({ children }) {
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#f3f5f9] text-slate-800">
      <AppSidebar />
      <div className="flex-1 h-screen overflow-y-auto min-w-0">
        {children}
      </div>
    </div>
  );
}
