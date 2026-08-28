import type { ReactNode } from "react";
import UniversitySidebar from "./UniversitySidebar";
import UniversityTopbar from "./UniversityTopbar";

interface UniversityLayoutProps {
  children: ReactNode;
  walletAddress: string;
  connected: boolean;
}

export default function UniversityLayout({
  children,
  walletAddress,
  connected,
}: UniversityLayoutProps) {
  return (
    <div className="dashboard-shell">
      <UniversitySidebar />

      <div className="dashboard-main">
        <UniversityTopbar
          walletAddress={walletAddress}
          connected={connected}
        />

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}