import styles from "./toto.module.scss";
import Container from "../../component/common/container/container.component";
import TotoForm from "../../form/toto/toto_form.component";

const TotoPage = () => {
  return (
    <Container className={styles["container"]}>
      <div className={styles["child-container"]}>
        <TotoForm />
      </div>
    </Container>
  );
};

export default TotoPage;
