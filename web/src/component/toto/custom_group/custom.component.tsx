import { FC, useEffect, useState } from "react";
import {
  CustomGroupInputType,
  CustomGroupType,
  ERROR_FIELD_CUSTOM_GROUP,
} from "./custom.type";

import styles from "./custom.module.scss";
import NumArrInput from "../../common/input/num_arr_input.component";
import RangeInput from "../../common/input/range_input.component";
import TrashbinIcon from "../../common/icon/trashbin.component";

export const DEFAULT_CUSTOM_GROUP_INPUT: CustomGroupInputType = {
  numbers: "",
  count: "",
};

const CustomGroup: FC<CustomGroupType> = ({
  name,
  idx,
  onInputChange,
  deleteHandler,
  errorField,
}) => {
  const [input, setInput] = useState<CustomGroupInputType>(
    DEFAULT_CUSTOM_GROUP_INPUT
  );

  useEffect(() => {
    onInputChange(input);
  }, [onInputChange, input]);

  return (
    <div className={styles["custom-group"]}>
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
        <label htmlFor="custom-numbers">Custom Group Numbers</label>
        <NumArrInput
          id={`custom-numbers-${idx}`}
          value={input.numbers}
          isInvalid={errorField === ERROR_FIELD_CUSTOM_GROUP.NUMBERS}
          placeholder="e.g: 1,2,3"
          onChangeHandler={(val) =>
            setInput((prev) => ({ ...prev, numbers: val }))
          }
        />
      </div>

      <div className={styles["form-group"]}>
        <label htmlFor="custom-count">Custom Number Count</label>
        <RangeInput
          id={`custom-count-${idx}`}
          isInvalid={errorField === ERROR_FIELD_CUSTOM_GROUP.COUNT}
          value={input.count}
          placeholder="e.g: 1, 0-6, !2"
          onChangeHandler={(val) =>
            setInput((prev) => ({ ...prev, count: val }))
          }
        />
      </div>
    </div>
  );
};

export default CustomGroup;
