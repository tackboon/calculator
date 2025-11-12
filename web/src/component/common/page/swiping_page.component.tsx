import { FC, HTMLAttributes, ReactNode } from "react";
import { animated, useTransition } from "@react-spring/web";

import styles from "./swiping_page.module.scss";

export const PageContent: FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
}) => {
  return <>{children}</>;
};

export enum SwipingDirection {
  SWIPE_LEFT = -1,
  SWIPE_RIGHT = 1,
}

type SwipingPagesProps = {
  pageIdx: number;
  direction: SwipingDirection;
  height: string;
  width: string;
  children: ReactNode[];
};

const SwipingPages: FC<SwipingPagesProps> = ({
  pageIdx,
  direction,
  height,
  children,
}) => {
  const transitions = useTransition(pageIdx, {
    key: pageIdx,
    from: { opacity: 0, transform: `translateX(${direction * 100}%)` },
    enter: { opacity: 1, transform: "translateX(0%)" },
    leave: { opacity: 0, transform: `translateX(${-direction * 100}%)` },
    config: { tension: 300, friction: 30 },
    initial: null,
  });

  return (
    <div className={styles["container"]} style={{ height: height }}>
      {transitions((style, i) => (
        <animated.div style={style} className={styles["content"]}>
          {children[i]}
        </animated.div>
      ))}
    </div>
  );
};

export default SwipingPages;
