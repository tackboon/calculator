import { FC, HTMLAttributes, ReactElement, ReactNode, useState } from "react";

import styles from "./tab_layout.module.scss";

type TabContentProps = {
  name: string;
  children: ReactNode;
};

export const TabContent: FC<TabContentProps> = ({ children }) => {
  return <>{children}</>;
};

type TabLayoutProps = {
  children: ReactElement<TabContentProps>[];
};

const TabLayout: FC<TabLayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={styles["tab-container"]}>
      <div className={styles["tab-nav-bar"]}>
        {children.map((tab, index) => (
          <div
            className={`${styles["tab-nav-item"]} ${
              index === activeTab ? styles["active"] : ""
            }`}
            key={index}
            onClick={() => setActiveTab(index)}
          >
            {tab.props.name}
          </div>
        ))}
      </div>

      <div className={styles["tab-content"]}>{children[activeTab]}</div>
    </div>
  );
};

export default TabLayout;
