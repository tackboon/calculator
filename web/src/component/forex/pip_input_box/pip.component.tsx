import { FC, useEffect, useState } from "react";

import styles from "./pip.module.scss";
import NumberInput from "../../common/input/number_input.component";
import Switch from "../../common/switch/switch.component";
import { parseBigNumberFromString } from "../../../common/number/number";
import { mathBigNum } from "../../../common/number/math";

type PipInputBoxProps = {
  id: string;
  defaultIsPip: boolean;
  defaultValue: string;
  defaultPipSize: number;
  isInvalid: boolean;
  hintPrefix: string;
  price: string;
  isIncr: boolean;
  onChange: (val: string) => void;
};

const PipInputBox: FC<PipInputBoxProps> = ({
  id,
  defaultIsPip,
  defaultValue,
  defaultPipSize,
  isInvalid,
  hintPrefix,
  price,
  isIncr,
  onChange,
}) => {
  const [isPip, setIsPip] = useState(defaultIsPip);
  const [value, setValue] = useState(defaultValue);
  const [pipSize, setPipSize] = useState(defaultPipSize);
  const [hintPrice, setHintPrice] = useState("");

  useEffect(() => {
    if (!isPip) {
      setHintPrice("");
      onChange(value);
      return;
    }

    try {
      const openPrice = parseBigNumberFromString(price);
      if (mathBigNum.equal(openPrice, 0)) return "0.00";

      const pip = parseBigNumberFromString();
      if (mathBigNum.equal(pip, 0)) return input.openPrice;

      if (input.isLong) {
        let stopPrice = mathBigNum.subtract(
          openPrice,
          mathBigNum.multiply(pip, input.pipSize)
        ) as BigNumber;
        stopPrice = mathBigNum.round(stopPrice, 5);

        return `${stopPrice}`;
      } else {
        let stopPrice = mathBigNum.add(
          openPrice,
          mathBigNum.multiply(pip, input.pipSize)
        ) as BigNumber;
        stopPrice = mathBigNum.round(stopPrice, 5);

        return `${stopPrice}`;
      }
    } catch (err) {
      return "";
    }
  }, [value, isPip, onChange]);

  return (
    <>
      <div className={styles["input-with-switch"]}>
        <NumberInput
          id={id}
          preUnit={!isPip ? "$" : ""}
          postUnit={isPip ? "PIP" : ""}
          isInvalid={isInvalid}
          minDecimalPlace={2}
          maxDecimalPlace={5}
          value={value}
          onChangeHandler={(val) => setValue(val)}
        />
        {pipSize > 0 && (
          <Switch
            height={46}
            borderRadius={5}
            names={["$", "PIP"]}
            defaultIndex={defaultIsPip ? 1 : 0}
            childWidth={50}
            onSwitch={(idx: number) => setIsPip(idx === 1)}
          />
        )}
      </div>
      {hintPrice && (
        <p className={styles["hint"]}>
          {hintPrefix} {hintPrice}
        </p>
      )}
    </>
  );
};

export default PipInputBox;
