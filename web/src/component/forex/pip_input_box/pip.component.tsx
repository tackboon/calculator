import { FC, useEffect, useState } from "react";

import styles from "./pip.module.scss";
import NumberInput from "../../common/input/number_input.component";
import Switch from "../../common/switch/switch.component";
import { parseBigNumberFromString } from "../../../common/number/number";
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
      setPipSize(defaultPipSize);
      onChange(value);
      return;
    }

    try {
      const openPrice = parseBigNumberFromString(price);
      if (mathBigNum.equal(openPrice, 0)) {
        setHintPrice("");
        onChange("0");
        return;
      }

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
      const calculatedPriceStr = `${calulatedPrice}`;
      setHintPrice(calculatedPriceStr);
      onChange(calculatedPriceStr);
    } catch (err) {
      return;
    }
  }, [value, isPip, onChange, isIncr, pipSize, price, defaultPipSize]);

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
          step={pipSize}
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

      <label htmlFor={id + "-pip-size"}>Pip Size</label>
      <NumberInput
        id={id + "-pip-size"}
        value={pipSize}
        minDecimalPlace={0}
        maxDecimalPlace={5}
        onChangeHandler={(val) => {
          setPipSize(parseFloat(val));
        }}
      />
    </>
  );
};

export default PipInputBox;
