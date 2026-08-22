import type { ReactNode } from "react";

import StudentSidebar from "./StudentSidebar";
import StudentTopbar from "./StudentTopbar";

interface StudentLayoutProps {
  children: ReactNode;
  walletAddress: string;
  connected: boolean;
  onConnect: () => void;
}

export default function StudentLayout({
  children,
  walletAddress,
  connected,
  onConnect,
}: StudentLayoutProps) {
  return (
    <div className="student-shell">
      <StudentSidebar />

      <div className="student-main">
        <StudentTopbar
          walletAddress={walletAddress}
          connected={connected}
          onConnect={onConnect}
        />

        <main className="student-content">
          {children}
        </main>
      </div>
    </div>
  );
}