import { useNavigate } from "react-router-dom";

import styles from "./not_found.module.scss";
import Button from "../../component/common/button/button.component";

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className={styles["container"]}>
      <h1>404</h1>
      <p>Looks like this page doesn't exist</p>
      <Button onClick={handleBackToHome}>Back to Home</Button>
    </div>
  );
};

export default NotFoundPage;
