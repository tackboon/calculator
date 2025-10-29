import Checkbox from "../../component/common/checkbox/checkbox.component";
import styles from "./toto.module.scss";

type OddEvenRuleProps = {

  onChangeHandler: (idx: number) => void;
} & SelectHTMLAttributes<HTMLSelectElement>;

const oddEvenRule = () => {
  return (
    <>
      <div className={styles["form-group"]} style={{ marginTop: "2rem" }}>
        <div className={styles["checkbox-wrapper"]}>
          <Checkbox
            id="oddeven-check"
            isCheck={input.includeOddEven}
            onCheck={() =>
              setInput((prev) => ({
                ...prev,
                includeOddEven: !input.includeOddEven,
              }))
            }
          />
          <span
            className={styles["checkbox-label"]}
            onClick={() =>
              setInput((prev) => ({
                ...prev,
                includeOddEven: !input.includeOddEven,
              }))
            }
          >
            Include Odd/Even Rule
          </span>
        </div>
      </div>

      <animated.div style={oddEvenStyles}>
        {input.includeOddEven && (
          <div className={styles["form-group"]}>
            <span className={`${styles["label"]} ${styles["option-label"]}`}>
              Odd Value Type
            </span>
            <SelectBox
              id="odd-even-typ"
              defaultIndex={0}
              options={["Exact Value", "Range Value"]}
              onChangeHandler={(idx) =>
                setInput((prev) => ({
                  ...prev,
                  oddEvenTyp: idx,
                }))
              }
            />

            <animated.div style={oddEvenChildStyles}>
              {input.oddEvenTyp === TOTO_VALUE.EXACT_VALUE && (
                <div className={styles["form-group"]}>
                  <label htmlFor="odd-count" className={styles["option-label"]}>
                    Odd Count
                  </label>
                  <NumberInput
                    id="odd-count"
                    min={0}
                    max={input.system}
                    isInvalid={errorField === ERROR_FIELD_TOTO.ODD}
                    minDecimalPlace={0}
                    maxDecimalPlace={0}
                    value={input.odd}
                    onChangeHandler={(val) =>
                      setInput((prev) => ({ ...prev, odd: val }))
                    }
                  />
                </div>
              )}

              {input.oddEvenTyp === TOTO_VALUE.RANGE_VALUE && (
                <div className={styles["form-group"]}>
                  <label htmlFor="min-odd-count">Min Odd Count</label>
                  <NumberInput
                    id="min-odd-count"
                    min={0}
                    max={input.system}
                    isInvalid={errorField === ERROR_FIELD_TOTO.MIN_ODD}
                    minDecimalPlace={0}
                    maxDecimalPlace={0}
                    value={input.minOdd}
                    onChangeHandler={(val) =>
                      setInput((prev) => ({ ...prev, minOdd: val }))
                    }
                  />
                </div>
              )}

              {input.oddEvenTyp === TOTO_VALUE.RANGE_VALUE && (
                <div className={styles["form-group"]}>
                  <label htmlFor="max-odd-count">Max Odd Count</label>
                  <NumberInput
                    id="max-odd-count"
                    min={0}
                    max={input.system}
                    isInvalid={errorField === ERROR_FIELD_TOTO.MAX_ODD}
                    minDecimalPlace={0}
                    maxDecimalPlace={0}
                    value={input.maxOdd}
                    onChangeHandler={(val) =>
                      setInput((prev) => ({ ...prev, maxOdd: val }))
                    }
                  />
                </div>
              )}
            </animated.div>
          </div>
        )}
      </animated.div>
    </>
  );
};

export default oddEvenRule;
