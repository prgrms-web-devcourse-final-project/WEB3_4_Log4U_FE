"use client";

import React from "react";

interface SideBarProps {
  children: React.ReactNode;
}

export default function SideBar({ children }: SideBarProps): React.JSX.Element {
  return (
    <aside className="bg-neutral flex flex-col justify-center items-center">
      {children}
    </aside>
  );
}
