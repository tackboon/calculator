import { FC, useEffect, useState } from "react";

import styles from "./pip.module.scss";
import NumberInput from "../../common/input/number_input.component";
import Switch from "../../common/switch/switch.component";
import {
  convertToLocaleString,
  parseBigNumberFromString,
} from "../../../common/number/number";
import {
  absBig,
  addBig,
  mathBigNum,
  multiplyBig,
  subtractBig,
} from "../../../common/number/math";
import { BigNumber } from "mathjs";

type PipInputBoxProps = {
  id: string;
  defaultIsPip: boolean;
  defaultValue: string;
  pipDecimal: number | string;
  isInvalid: boolean;
  hintPrefix: string;
  price: string;
  isIncr: boolean;
  resetSignal: boolean;
  onChange: (val: string, isPip: boolean) => void;
};

const PipInputBox: FC<PipInputBoxProps> = ({
  id,
  defaultIsPip,
  defaultValue,
  pipDecimal,
  isInvalid,
  hintPrefix,
  price,
  isIncr,
  resetSignal,
  onChange,
}) => {
  const [pipDec, setPipDec] = useState(
    typeof pipDecimal === "string"
      ? parseBigNumberFromString(pipDecimal)
      : mathBigNum.bignumber(pipDecimal)
  );
  const [isPip, setIsPip] = useState(defaultIsPip);
  const [value, setValue] = useState(defaultValue);
  const [hintPrice, setHintPrice] = useState<BigNumber | undefined>(undefined);

  useEffect(() => {
    setPipDec(
      typeof pipDecimal === "string"
        ? parseBigNumberFromString(pipDecimal)
        : mathBigNum.bignumber(pipDecimal)
    );
  }, [pipDecimal]);

  useEffect(() => {
    setValue("0");
  }, [resetSignal]);

  useEffect(() => {
    if (!isPip) {
      setHintPrice(undefined);
      onChange(value, false);
      return;
    }

    try {
      const openPrice = parseBigNumberFromString(price);
      const pip = parseBigNumberFromString(value);
      if (mathBigNum.equal(pip, 0)) {
        setHintPrice(openPrice);
        onChange(price, true);
        return;
      }

      let calulatedPrice = isIncr
        ? addBig(openPrice, multiplyBig(pip, pipDec))
        : subtractBig(openPrice, multiplyBig(pip, pipDec));
      calulatedPrice = mathBigNum.round(calulatedPrice, 5);
      const calculatedPriceStr = convertToLocaleString(calulatedPrice, 2, 5);

      setHintPrice(calulatedPrice);
      onChange(calculatedPriceStr, true);
    } catch (err) {
      return;
    }
  }, [value, isPip, onChange, isIncr, pipDec, price]);

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
          step={isPip ? 1 : pipDec.toString()}
          value={value}
          onChangeHandler={(val) => setValue(val)}
        />

        <Switch
          height={46}
          borderRadius={5}
          names={["$", "PIP"]}
          defaultIndex={isPip ? 1 : 0}
          childWidth={50}
          onSwitch={(idx: number) => setIsPip(idx === 1)}
        />
      </div>
      {hintPrice !== undefined && (
        <div className={styles["hint-container"]}>
          <p className={`${styles["hint"]} ${styles["value"]}`}>
            {hintPrefix}
            {" "}
            {mathBigNum.smaller(hintPrice, 0) ? "-" : ""}$
            {convertToLocaleString(absBig(hintPrice))}
          </p>
          <p className={`${styles["hint"]} ${styles["unit"]}`}>
            {convertToLocaleString(pipDec, 0)} pip decimal
          </p>
        </div>
      )}
    </>
  );
};

export default PipInputBox;
