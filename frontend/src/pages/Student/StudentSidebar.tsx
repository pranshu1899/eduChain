import {
  Link,
  useLocation,
} from "react-router-dom";

export default function StudentSidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/student") {
      return location.pathname === "/student";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <aside className="student-sidebar">

      <div className="student-brand">

        <div className="student-brand-mark">
          E
        </div>

        <div>
          <div className="student-brand-name">
            EduProof
          </div>

          <div className="student-brand-subtitle">
            Academic Credential Network
          </div>
        </div>

      </div>

      <div className="student-portal-label">
        STUDENT PORTAL
      </div>

      <nav className="student-navigation">

        <Link
          to="/student"
          className={
            isActive("/student")
              ? "student-nav-item active"
              : "student-nav-item"
          }
        >
          <span className="student-nav-icon">
            ⌂
          </span>

          <span>
            Overview
          </span>
        </Link>

        <Link
          to="/student/credentials"
          className={
            isActive("/student/credentials")
              ? "student-nav-item active"
              : "student-nav-item"
          }
        >
          <span className="student-nav-icon">
            ▣
          </span>

          <span>
            My Credentials
          </span>
        </Link>

      </nav>

      <div className="student-sidebar-bottom">

        <div className="student-network-card">

          <div className="student-network-icon">
            ◆
          </div>

          <div>
            <strong>
              Blockchain secured
            </strong>

            <span>
              Sepolia Network
            </span>
          </div>

        </div>

        <Link
          to="/"
          className="student-change-role"
        >
          ← Change role
        </Link>

      </div>

    </aside>
  );
}