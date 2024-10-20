import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import styles from "./nav_layout.module.scss";

const NavLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State to manage whether navigation menu is open or closed
  const [isOpen, setIsOpen] = useState(false);

  // State to track whether the view is mobile view
  const [isSmallView, setIsSmallView] = useState(window.innerWidth <= 600);

  // Handle window resize
  const handleResize = () => {
    setIsSmallView(window.innerWidth <= 600);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Function to toggle the navigation menu and handle navigation to different links
  const toggleNav = (link?: string) => {
    if (isSmallView || isOpen) {
      setIsOpen(!isOpen);
    }

    if (link) {
      navigate(link);
    }
  };

  // Determine if the logout button should be hidden
  const hideLogin =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className={styles["wrapper"]}>
      <nav className={`${styles["nav-bar"]} ${isOpen ? styles["open"] : ""}`}>
        <div className={styles["hamburger-icon"]}>
          <span onClick={() => toggleNav()}>☰</span>
        </div>

        <div className={styles["close-btn"]}>
          <span onClick={() => toggleNav()}>&times;</span>
        </div>

        <div className={styles["container"]}>
          <ul>
            <li>
              <span onClick={() => toggleNav("/calculator")}>Calculator</span>
            </li>
            <li>
              <span onClick={() => toggleNav("/journal")}>Trade Journal</span>
            </li>
            <li>
              <span onClick={() => toggleNav("/portfolio")}>Portfolio</span>
            </li>
          </ul>

          <ul className={hideLogin ? styles["hide"] : ""}>
            <li onClick={() => toggleNav("/login")}>Logout</li>
          </ul>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default NavLayout;
