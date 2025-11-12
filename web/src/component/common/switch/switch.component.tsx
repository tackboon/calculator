import { FC, useState } from "react";
import { useSpring, animated } from "@react-spring/web";

import styles from "./switch.module.scss";

type SwitchProps = {
  childWidth: number;
  names: string[];
  defaultIndex: number;
  height: number;
  borderRadius: number;
  onSwitch?: (idx: number) => void;
};

const Switch: FC<SwitchProps> = ({
  childWidth,
  names,
  defaultIndex,
  height,
  borderRadius,
  onSwitch,
}) => {
  const [idx, setIdx] = useState(defaultIndex);

  const handleSwitch = (index: number) => {
    if (idx === index) {
      return;
    }

    setIdx(index);

    if (onSwitch) {
      onSwitch(index);
    }
  };

  const sliderStyle = useSpring({
    left: `${childWidth * idx}px`,
    width: `${childWidth}px`,
    borderRadius: borderRadius,
  });

  return (
    <div className={styles["container"]} style={{ borderRadius }}>
      <animated.div className={styles["slider"]} style={sliderStyle} />

      {names.map((name, i) => (
        <span
          key={i}
          className={`${styles["label"]} ${i === idx ? styles["active"] : ""}`}
          onClick={() => handleSwitch(i)}
          style={{ width: childWidth, height, borderRadius }}
        >
          {name}
        </span>
      ))}
    </div>
  );
};

export default Switch;
