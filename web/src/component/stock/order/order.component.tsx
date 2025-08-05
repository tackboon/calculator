import { FC, useEffect, useState } from "react";
import { useSpring, animated } from "@react-spring/web";

import styles from "./order.module.scss";
import NumberInput from "../../common/input/number_input.component";
import Checkbox from "../../common/checkbox/checkbox.component";
import SelectBox from "../../common/select_box/select_box.component";
import TrashbinIcon from "../../common/icon/trashbin.component";
import {
  ERROR_FIELD_STOCK_ORDER,
  StockOrderInputType,
  StockOrderType,
} from "./order.type";

export const DEFAULT_STOCK_ORDER_INPUT: StockOrderInputType = {
  entryPrice: "0",
  quantity: "0",
  stopLoss: "0",
  profitGoal: "0",
  isLong: true,
  includeProfitGoal: false,
};

const Order: FC<StockOrderType> = ({
  name,
  idx,
  errorField,
  onInputChange,
  deleteHandler,
}) => {
  const [input, setInput] = useState<StockOrderInputType>(
    DEFAULT_STOCK_ORDER_INPUT
  );

  useEffect(() => {
    onInputChange(input);
  }, [onInputChange, input]);

  const animationStyles = useSpring({
    height: input.includeProfitGoal ? 100 : 0,
    opacity: input.includeProfitGoal ? 1 : 0,
    overflow: "hidden",
    config: {
      duration: 500,
      easing: (t) => t * t * (3 - 2 * t),
    },
  });

  return (
    <div className={styles["order-group"]}>
      <div className={styles["header"]}>
        <h2>{name}</h2>
        <div className={styles["delete-wrapper"]} onClick={deleteHandler}>
          <TrashbinIcon
            fill="#e60026"
            size={20}
            className={styles["delete-icon"]}
          />
        </div>
      </div>

      <div className={styles["form-group"]}>
        <label htmlFor={`entry-price-${idx}`}>Order Type</label>
        <SelectBox
          options={["Long", "Short"]}
          defaultIndex={0}
          onChangeHandler={(idx) => setInput({ ...input, isLong: idx === 0 })}
        />
      </div>

      <div className={styles["form-group"]}>
        <label htmlFor={`entry-price-${idx}`}>Open Price</label>
        <NumberInput
          id={`entry-price-${idx}`}
          preUnit="$"
          isInvalid={errorField === ERROR_FIELD_STOCK_ORDER.ENTRY_PRICE}
          minDecimalPlace={2}
          maxDecimalPlace={5}
          value={input.entryPrice}
          onChangeHandler={(val) => setInput({ ...input, entryPrice: val })}
        />
      </div>

      <div className={styles["form-group"]}>
        <label htmlFor={`quantity-${idx}`}>Quantity (Unit)</label>
        <NumberInput
          id={`quantity-${idx}`}
          isInvalid={errorField === ERROR_FIELD_STOCK_ORDER.QUANTITY}
          minDecimalPlace={0}
          maxDecimalPlace={6}
          value={input.quantity}
          onChangeHandler={(val) => setInput({ ...input, quantity: val })}
        />
      </div>

      <div className={styles["form-group"]}>
        <label htmlFor={`stop-loss-${idx}`}>Stop Loss</label>
        <NumberInput
          id={`stop-loss-${idx}`}
          preUnit={"$"}
          isInvalid={errorField === ERROR_FIELD_STOCK_ORDER.STOP_LOSS}
          minDecimalPlace={2}
          maxDecimalPlace={5}
          value={input.stopLoss}
          onChangeHandler={(val) => setInput({ ...input, stopLoss: val })}
        />
      </div>

      <div className={styles["form-group"]}>
        <div className={styles["checkbox-wrapper"]}>
          <Checkbox
            isCheck={input.includeProfitGoal}
            onCheck={() => {
              setInput({
                ...input,
                includeProfitGoal: !input.includeProfitGoal,
                profitGoal: DEFAULT_STOCK_ORDER_INPUT.profitGoal,
              });
            }}
          />
          <span>Include Profit Goal</span>
        </div>
      </div>

      <animated.div style={animationStyles}>
        {input.includeProfitGoal && (
          <div className={styles["form-group"]}>
            <label htmlFor={`profit-goal-${idx}`}>Profit Target</label>
            <NumberInput
              id={`profit-goal-${idx}`}
              preUnit={"$"}
              isInvalid={errorField === ERROR_FIELD_STOCK_ORDER.PROFIT_TARGET}
              minDecimalPlace={2}
              maxDecimalPlace={5}
              value={input.profitGoal}
              onChangeHandler={(val) => setInput({ ...input, profitGoal: val })}
            />
          </div>
        )}
      </animated.div>
    </div>
  );
};

export default Order;
