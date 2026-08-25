import React from "react";
import ProgramSelector from "./sidebar/ProgramSelector.jsx";

export default function LoginSidebar() {
  return (
    <aside className="w-full sm:w-lg h-full select-none md:border-l border-zinc-200 bg-white flex flex-col relative overflow-hidden">
      <ProgramSelector />
    </aside>
  );
}
