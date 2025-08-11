import { FC, useEffect, useState } from "react";

import styles from "./pip.module.scss";
import NumberInput from "../../common/input/number_input.component";
import Switch from "../../common/switch/switch.component";
import {
  convertToLocaleString,
  parseBigNumberFromString,
} from "../../../common/number/number";
import {
  addBig,
  mathBigNum,
  multiplyBig,
  subtractBig,
} from "../../../common/number/math";

type PipInputBoxProps = {
  id: string;
  defaultIsPip: boolean;
  defaultValue: string;
  pipSize: number;
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
  pipSize,
  isInvalid,
  hintPrefix,
  price,
  isIncr,
  onChange,
}) => {
  const [isPip, setIsPip] = useState(defaultIsPip);
  const [value, setValue] = useState(defaultValue);
  const [hintPrice, setHintPrice] = useState("");

  useEffect(() => {
    if (!isPip) {
      setHintPrice("");
      onChange(value);
      return;
    }

    try {
      const openPrice = parseBigNumberFromString(price);
      const pip = parseBigNumberFromString(value);
      if (mathBigNum.equal(pip, 0)) {
        setHintPrice(price);
        onChange(price);
        return;
      }

      let calulatedPrice = isIncr
        ? addBig(openPrice, multiplyBig(pip, pipSize))
        : subtractBig(openPrice, multiplyBig(pip, pipSize));
      calulatedPrice = mathBigNum.round(calulatedPrice, 5);
      const calculatedPriceStr = convertToLocaleString(calulatedPrice, 2, 5);

      setHintPrice(calculatedPriceStr);
      onChange(calculatedPriceStr);
    } catch (err) {
      return;
    }
  }, [value, isPip, onChange, isIncr, pipSize, price]);

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
          step={isPip ? 1 : pipSize}
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
        <div className={styles["hint-container"]}>
          <p className={styles["hint"]}>
            {hintPrefix} {hintPrice}
          </p>
          <p className={styles["hint"]}>{pipSize} pip size</p>
        </div>
      )}
    </>
  );
};

export default PipInputBox;
