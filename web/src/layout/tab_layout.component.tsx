import { FC, ReactElement, ReactNode, useState } from "react";
import { useSpring, animated } from "@react-spring/web";

import styles from "./tab_layout.module.scss";
import { useGetViewSize } from "../common/screen/size";
import SelectBox from "../component/common/select_box/select_box.component";

type TabContentProps = {
  name: string;
  children: ReactNode;
};

export const TabContent: FC<TabContentProps> = ({ children }) => {
  return <>{children}</>;
};

type TabLayoutProps = {
  showSelectBox: boolean;
  minChildWidth: number;
  maxChildWidth: number;
  children: ReactElement<TabContentProps>[];
};

const getTabWidth = (vSize: number, min: number, max: number) => {
  let tabWidth = (vSize - 19.2) / 4;
  if (tabWidth < min) {
    tabWidth = min;
  } else if (tabWidth > max) {
    tabWidth = max;
  }

  return tabWidth;
};

const TabLayout: FC<TabLayoutProps> = ({
  children,
  minChildWidth,
  maxChildWidth,
  showSelectBox,
}) => {
  const viewSize = useGetViewSize();
  const [activeTab, setActiveTab] = useState(0);

  const tabWidth = getTabWidth(viewSize, minChildWidth, maxChildWidth);
  const sliderStyle = useSpring({
    left: `${tabWidth * activeTab}px`,
    width: `${tabWidth}px`,
    config: {
      duration: 200,
    },
  });

  // Content fade animation
  const contentStyle = useSpring({
    opacity: 1,
    from: { opacity: 0 },
    config: { duration: 200 },
    reset: true,
  });

  return (
    <div className={styles["tab-container"]}>
      <div
        className={`${styles["tab-nav-bar"]} ${
          showSelectBox ? styles["is-select"] : ""
        }`}
      >
        <div
          className={`${styles["tab-nav-bar-container"]} ${
            showSelectBox ? styles["is-select"] : ""
          }`}
        >
          {showSelectBox ? (
            <div className={styles["select-container"]}>
              <SelectBox
                id={"calculator-selector"}
                defaultIndex={activeTab}
                options={children.map((tab) => tab.props.name)}
                onChangeHandler={(idx) => setActiveTab(idx)}
              />
            </div>
          ) : (
            children.map((tab, index) => (
              <div
                className={`${styles["tab-nav-item"]} ${
                  index === activeTab ? styles["active"] : ""
                }`}
                style={{ width: tabWidth }}
                key={index}
                onClick={() => setActiveTab(index)}
              >
                {tab.props.name}
              </div>
            ))
          )}
        </div>
        {!showSelectBox && (
          <animated.div className={styles["slider"]} style={sliderStyle} />
        )}
      </div>

      <animated.div
        className={styles["tab-content"]}
        style={contentStyle}
        key={activeTab}
      >
        {children[activeTab]}
      </animated.div>
    </div>
  );
};

export default TabLayout;
