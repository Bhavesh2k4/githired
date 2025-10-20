"use client";

import { User } from "lucide-react";
import { Logout } from "./logout";
import { ModeToggle } from "./mode-toggle";

export function SidebarFooterContent({ 
  userName, 
  userEmail 
}: { 
  userName?: string; 
  userEmail?: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 px-1 py-1">
          <User className="w-4 h-4" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{userName || "User"}</span>
            <span className="text-xs text-muted-foreground">{userEmail}</span>
          </div>
        </div>
        <ModeToggle />
      </div>
      <Logout />
    </div>
  );
}

