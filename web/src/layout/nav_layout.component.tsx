import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import styles from "./nav_layout.module.scss";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../store/user/user.selector";
import Scrollable from "../component/common/scrollbar/scrollbar.component";
import ImageWithSkeleton from "../component/common/image/image.component";
import Slidebar from "../component/common/slidebar/slidebar.component";

const NavLayout = () => {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [name, setName] = useState("");

  // State to manage whether navigation menu is open or closed
  const [isOpen, setIsOpen] = useState(false);

  // Function to toggle the navigation menu and handle navigation to different links
  const toggleNav = (link?: string) => {
    if (link) {
      setIsOpen(false);
      navigate(link);
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    setName("");
    if (currentUser && currentUser.email !== "") {
      const parts = currentUser.email.split("@");
      if (parts.length > 1) setName(parts[0]);
    }
  }, [currentUser]);

  return (
    <>
      <div className={styles["container"]}>
        <nav className={styles["nav-bar"]}>
          <div className={styles["child-container"]}>
            <div className={styles["child-wrapper"]}>
              <ImageWithSkeleton
                src="/logo192_white.png"
                alt="logo"
                className={styles["logo-image"]}
                onClick={() => toggleNav("/trading-calculator")}
              />

              <h3
                className={styles["logo-title"]}
                onClick={() => toggleNav("/trading-calculator")}
              >
                TB Winrate
              </h3>
            </div>
          </div>

          <div className={styles["hamburger-icon"]}>
            <span onClick={() => toggleNav()}>☰</span>
          </div>
        </nav>

        <Slidebar
          isOpen={isOpen}
          onClose={() => toggleNav()}
          position="right"
          className={styles["slidebar"]}
        >
          {name && (
            <p className={styles["welcome"]}>
              👋 Welcome, <span>{name}</span>
            </p>
          )}

          <ul>
            <li onClick={() => toggleNav("/trading-calculator")}>Trading Calculator</li>

            {/* {currentUser ? (
              <li onClick={() => dispatch(logout())}>Logout</li>
            ) : (
              <li onClick={() => toggleNav("/login")}>Login</li>
            )} */}
          </ul>
        </Slidebar>

        <main>
          <Scrollable>
            <Outlet />
          </Scrollable>
        </main>
      </div>
      <Toaster />
    </>
  );
};

export default NavLayout;
