import type { ReactNode } from "react";
import UniversitySidebar from "./UniversitySidebar";
import UniversityTopbar from "./UniversityTopbar";

interface UniversityLayoutProps {
  children: ReactNode;
}

export default function UniversityLayout({
  children,
}: UniversityLayoutProps) {
  return (
    <div className="university-shell">
      <UniversitySidebar />

      <div className="university-main">
        <UniversityTopbar />

        <main className="university-content">
          {children}
        </main>
      </div>
    </div>
  );
}