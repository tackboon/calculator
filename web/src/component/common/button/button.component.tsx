import {
  ButtonHTMLAttributes,
  FC,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import styles from "./button.module.scss";

type ButtonProps = {
  children?: ReactNode;
  className?: string;
  cooldownPeriod?: number;
  checkCooldown?: boolean;
  disabled?: boolean;
  getRemainingCooldown?: () => Promise<number | string | null>;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const Button: FC<ButtonProps> = ({
  children,
  className,
  cooldownPeriod,
  checkCooldown,
  disabled,
  getRemainingCooldown,
  ...props
}) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const intervalID = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handler to start the counter
  const startCooldown = () => {
    if (intervalID.current) return;

    // Start the countdown
    const id = setInterval(() => {
      setCooldown((prevCooldown) => {
        if (prevCooldown <= 1) {
          clearInterval(id);
          intervalID.current = null;
          setIsDisabled(false);
          return 0;
        }
        return prevCooldown - 1;
      });
    }, 1000);
    intervalID.current = id;
  };

  useEffect(() => {
    if (cooldownPeriod && getRemainingCooldown) {
      (async () => {
        const lastActionTime = await getRemainingCooldown();
        if (lastActionTime) {
          const elapsedTime = Math.floor(
            (Date.now() - Number(lastActionTime)) / 1000
          );
          const remainingCooldown = cooldownPeriod - elapsedTime;

          // Start the timer if there's time left
          if (remainingCooldown > 0) {
            setIsDisabled(true);
            setCooldown(remainingCooldown);
            startCooldown();
          }
        }
      })();

      // Cleanup interval
      return () => {
        if (intervalID.current) {
          clearInterval(intervalID.current);
        }
      };
    }
  }, [checkCooldown, cooldownPeriod, getRemainingCooldown]);

  return (
    <button
      className={`${styles["btn"]} ${className ? className : ""}`}
      disabled={isDisabled || disabled}
      {...props}
    >
      {children}
      {cooldown > 0 ? ` (${cooldown})s` : ""}
    </button>
  );
};

export default Button;
