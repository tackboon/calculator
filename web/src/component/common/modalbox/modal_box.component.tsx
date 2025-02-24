import { FC, HTMLAttributes } from "react";

import styles from "./modal_box.module.scss";
import Container from "../container/container.component";
import CloseIcon from "../icon/close.component";
import Scrollable from "../scrollbar/scrollbar.component";

type ModalBoxType = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
} & HTMLAttributes<HTMLDivElement>;

const ModalBox: FC<ModalBoxType> = ({ isOpen, title, children, onClose }) => {
  return (
    <div className={`${styles["modal"]} ${isOpen ? styles["open"] : ""}`}>
      <Container className={`${styles["modal-content"]}`}>
        <div className={styles["header"]}>
          <h2>{title}</h2>
          <div className={styles["close"]} onClick={onClose}>
            <CloseIcon size={32} />
          </div>
        </div>
        <Scrollable className={styles["body"]}>{children}</Scrollable>
      </Container>
    </div>
  );
};

export default ModalBox;
