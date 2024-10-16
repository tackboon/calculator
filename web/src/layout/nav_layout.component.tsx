import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import styles from "./nav_layout.module.scss";

const NavLayout = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSmallView, setIsSmallView] = useState(window.innerWidth <= 600);

  const handleResize = () => {
    setIsSmallView(window.innerWidth <= 600);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleNav = (link?: string) => {
    if (isSmallView || isOpen) {
      setIsOpen(!isOpen);
    }

    if (link) {
      navigate(link);
    }
  };

  return (
    <>
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
          <ul>
            <li onClick={() => toggleNav()}>Logout</li>
          </ul>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default NavLayout;
