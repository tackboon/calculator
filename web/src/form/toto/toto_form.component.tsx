import { useEffect, useRef, useState } from "react";

import styles from "./toto.module.scss";
import {
  ERROR_FIELD_TOTO,
  TOTO_RANGE,
  TotoCombination,
  TotoInputType,
} from "./toto.type";
import { generateCombinations, validateTotoInput } from "./utils.component";
import Button from "../../component/common/button/button.component";
import Container from "../../component/common/container/container.component";
import Input from "../../component/common/input/input.component";
import SelectBox from "../../component/common/select_box/select_box.component";
import NumArrInput from "../../component/common/input/num_arr_input.component";
import SplitInput from "../../component/common/input/split_input.component";

const DEFAULT_INPUT: TotoInputType = {
  count: "1",
  system: 6,
  numberRange: TOTO_RANGE.FOURTY_NINE,
  mustIncludes: "",
  mustExcludes: "",
  conditionalGroups: "",
  conditionalCount: "0",
  oddEven: "",
  lowHigh: "",
};

const TotoForm = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<ERROR_FIELD_TOTO | null>(null);
  const [input, setInput] = useState<TotoInputType>(DEFAULT_INPUT);
  const [distribution, setDistribution] = useState("3/3");

  const [result, setResult] = useState<TotoCombination[] | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Scroll to result after it is updated
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Handle validation
    const { err, field } = validateTotoInput(input);
    setErrorMessage(err);
    setErrorField(field);
    if (err !== "") return;

    // generate combinations
    setResult(generateCombinations(input));
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");
    setInput((prev) => ({
      ...DEFAULT_INPUT,
      system: prev.system,
      numberRange: prev.numberRange,
    }));
    setErrorField(null);
    setResult(null);
  };

  return (
    <form className={styles["form-wrapper"]} onSubmit={handleSubmit}>
      <h1 className={styles["title"]}>TOTO Generator</h1>

      <p className={styles["description"]}>
        This generator helps you create personalized number combinations with
        smart, flexible rules that blend luck and strategy. It offers full
        control over how your combinations are generated, allowing you to enjoy
        a balanced mix of randomness and customization to craft as many unique
        sets as you like.
      </p>

      <div>
        <div className={styles["form-group"]}>
          <label htmlFor="count">
            Enter how many TOTO combinations you want to generate{" "}
            <span style={{ color: "red" }}>*</span>
          </label>
          <Input
            id="count"
            type="number"
            min={1}
            max={100}
            value={input.count}
            isInvalid={errorField === ERROR_FIELD_TOTO.COUNT}
            onChange={(e) =>
              setInput((prev) => ({ ...prev, count: e.target.value }))
            }
            onBlur={(e) => {
              let count = Number(e.target.value);
              if (isNaN(count) || count < 1 || count > 100) {
                count = 1;
              }
              e.target.value = count.toString();

              setInput((prev) => ({ ...prev, count: e.target.value }));
            }}
          />
        </div>

        <div className={styles["form-group"]}>
          <span className={styles["label"]}>System Type</span>
          <SelectBox
            id="system"
            options={[
              "System 6",
              "System 7",
              "System 8",
              "System 9",
              "System 10",
              "System 11",
              "System 12",
            ]}
            defaultIndex={input.system - 6}
            onChangeHandler={(idx) => {
              const system = idx + 6;
              const half = Math.floor(system / 2);

              setInput((prev) => ({ ...prev, system }));
              setDistribution(`${half}/${system - half}`);
            }}
          />
        </div>

        <div className={styles["form-group"]}>
          <span className={styles["label"]}>Number Range</span>
          <SelectBox
            id="range"
            options={["1-49", "1-50", "1-55", "1-58", "1-69"]}
            defaultIndex={input.numberRange}
            onChangeHandler={(idx) =>
              setInput((prev) => ({ ...prev, numberRange: idx }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="must-includes">Must Include Numbers</label>
          <NumArrInput
            id="must-includes"
            value={input.mustIncludes}
            isInvalid={errorField === ERROR_FIELD_TOTO.MUST_INCLUDES}
            placeholder="e.g: 1,2,3"
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, mustIncludes: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="must-excludes">Must Exclude Numbers</label>
          <NumArrInput
            id="must-excludes"
            value={input.mustExcludes}
            isInvalid={errorField === ERROR_FIELD_TOTO.MUST_EXCLUDES}
            placeholder="e.g: 1,2,3"
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, mustExcludes: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <div className={styles["conditional-container"]}>
            <span className={styles["label"]}>
              Select a Number Group and Set How Many Must Appear
            </span>

            <label
              htmlFor="group-numbers"
              className={`${styles["conditional-child"]} ${styles["conditional-label"]}`}
            >
              Numbers in This Group
            </label>
            <NumArrInput
              id="group-numbers"
              className={styles["conditional-child"]}
              value={input.conditionalGroups}
              isInvalid={errorField === ERROR_FIELD_TOTO.CONDITIONAL_GROUPS}
              placeholder="e.g: 1,2,3"
              onChangeHandler={(val) =>
                setInput((prev) => ({ ...prev, conditionalGroups: val }))
              }
            />

            <label
              htmlFor="group-count"
              className={`${styles["conditional-child"]} ${styles["conditional-label"]}`}
            >
              Minimum Count
            </label>
            <Input
              id="group-count"
              className={styles["conditional-child"]}
              type="number"
              min={0}
              max={12}
              value={input.conditionalCount}
              isInvalid={errorField === ERROR_FIELD_TOTO.CONDITIONAL_COUNT}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  conditionalCount: e.target.value,
                }))
              }
              onBlur={(e) => {
                let count = Number(e.target.value);
                if (isNaN(count) || count < 0 || count > 12) {
                  count = 0;
                }
                e.target.value = count.toString();

                setInput((prev) => ({
                  ...prev,
                  conditionalCount: e.target.value,
                }));
              }}
            />
          </div>
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="odd-even">Odd/Even Distribution</label>
          <SplitInput
            id="odd-even"
            value={input.oddEven}
            isInvalid={errorField === ERROR_FIELD_TOTO.ODD_EVEN}
            placeholder={`e.g: ${distribution}`}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, oddEven: val }))
            }
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="low-high">Low/High Distribution</label>
          <SplitInput
            id="low-high"
            value={input.lowHigh}
            isInvalid={errorField === ERROR_FIELD_TOTO.LOW_HIGH}
            placeholder={`e.g: ${distribution}`}
            onChangeHandler={(val) =>
              setInput((prev) => ({ ...prev, lowHigh: val }))
            }
          />
        </div>

        <p className={styles["error"]}>{errorMessage}</p>
      </div>

      <div className={styles["form-btn"]}>
        <Button
          className={styles["reset-btn"]}
          type="reset"
          tabIndex={-1}
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button className={styles["submit-btn"]} type="submit">
          Generate
        </Button>
      </div>

      <div ref={resultRef}>
        {result && (
          <Container className={`${styles["result-container"]}`}>
            <div className={styles["result-wrapper"]}>
              {result.map((res, idx) => (
                <div key={`toto-res-${idx}`}>
                  <h2>
                    {idx + 1}) {res.combination}
                  </h2>
                  <div className={styles["row"]}>
                    <div>Odd/Even:</div>
                    <div>{res.oddEven}</div>
                  </div>
                  <div className={styles["row"]}>
                    <div>Low/High:</div>
                    <div>{res.lowHigh}</div>
                  </div>
                  <div className={styles["row"]}>
                    <div>Sum:</div>
                    <div>{res.sum}</div>
                  </div>
                  <div className={styles["row"]}>
                    <div>Average:</div>
                    <div>{res.average}</div>
                  </div>
                  <br />
                  {res.outputGroups.map((r, i) => (
                    <div key={`toto-group-${i}`}>
                      <div className={styles["row"]}>
                        <div>{r.name}:</div>
                        <div>{r.count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Container>
        )}
      </div>
    </form>
  );
};

export default TotoForm;
