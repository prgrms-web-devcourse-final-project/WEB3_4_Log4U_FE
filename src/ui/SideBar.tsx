"use client";

import React from "react";

interface SideBarProps {
  children: React.ReactNode;
}

export default function SideBar({ children }: SideBarProps): React.JSX.Element {
  return (
    <aside className="bg-neutral justify-items-center content-center">
      {children}
    </aside>
  );
}
