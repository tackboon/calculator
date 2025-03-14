import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import styles from "./nav_layout.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../store/user/user.selector";
import { logout } from "../store/user/user.action";
import Scrollable from "../component/common/scrollbar/scrollbar.component";
import { useCheckIsSmallView } from "../common/screen/size";

const NavLayout = () => {
  // State to track whether the view is small view
  const isSmallView = useCheckIsSmallView();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const currentUser = useSelector(selectCurrentUser);

  // State to manage whether navigation menu is open or closed
  const [isOpen, setIsOpen] = useState(false);

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
    <>
      <div className={styles["container"]}>
        <nav className={`${styles["nav-bar"]} ${isOpen ? styles["open"] : ""}`}>
          <div className={styles["hamburger-icon"]}>
            <span onClick={() => toggleNav()}>☰</span>
          </div>

          <div className={styles["close-btn"]}>
            <span onClick={() => toggleNav()}>&times;</span>
          </div>

          <div className={styles["child-container"]}>
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
              {currentUser ? (
                <li onClick={() => dispatch(logout())}>Logout</li>
              ) : (
                <li onClick={() => toggleNav("/login")}>Login</li>
              )}
            </ul>
          </div>
        </nav>
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
