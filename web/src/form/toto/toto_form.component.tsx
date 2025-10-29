import { useEffect, useRef, useState } from "react";
import { useTransition, animated, useSpring } from "@react-spring/web";

import styles from "./toto.module.scss";
import {
  ERROR_FIELD_TOTO,
  TOTO_RANGE,
  TOTO_VALUE,
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
import TrashbinIcon from "../../component/common/icon/trashbin.component";

const DEFAULT_INPUT: TotoInputType = {
  count: "1",
  system: 6,
  numberRange: TOTO_RANGE.FOURTY_NINE,
  mustIncludes: "",
  mustExcludes: "",
  includeOddEven: false,
  oddValueTyp: TOTO_VALUE.EXACT_VALUE,
  odd: "0",
  minOdd: "0",
  maxOdd: "0",
  evenValueTyp: TOTO_VALUE.EXACT_VALUE,
  even: "0",
  minEven: "0",
  maxEven: "0",
  customGroups: "",
  customCount: "0",
  lowHigh: "",
};

const TotoForm = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<ERROR_FIELD_TOTO | null>(null);
  const [input, setInput] = useState<TotoInputType>(DEFAULT_INPUT);
  const [distribution, setDistribution] = useState("3/3");

  const [result, setResult] = useState<TotoCombination[] | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Scroll to result after it is updated
  useEffect(() => {
    if (isGenerating && result && resultRef.current) {
      setIsGenerating(false);
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result, isGenerating]);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Remove old results
    setResult(null);

    // Handle validation
    const { err, field } = validateTotoInput(input);
    setErrorMessage(err);
    setErrorField(field);
    if (err !== "") return;

    setIsGenerating(true);

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
      includeOddEven: prev.includeOddEven,
      oddEvenTyp: prev.oddEvenTyp,
    }));
    setErrorField(null);
    setResult(null);
  };

  const deleteResultHandler = (idx: number) => {
    setResult((prev) => {
      if (!prev) return prev;
      const updated = [...prev];
      updated.splice(idx, 1);
      return updated;
    });
  };

  const oddEvenStyles = useSpring({
    height: input.includeOddEven ? 1000 : 0,
    opacity: input.includeOddEven ? 1 : 0,
    overflow: "hidden",
  });

  const oddEvenChildStyles = useSpring({
    height: input.oddEvenTyp === TOTO_VALUE.EXACT_VALUE ? 600 : 800,
    overflow: "hidden",
  });

  const transitions = useTransition(result || [], {
    from: { opacity: 1, height: 360 },
    enter: { opacity: 1, height: 360 },
    leave: !isGenerating ? [{ opacity: 0 }, { height: 0 }] : [],
    config: { duration: 400 },
  });

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

        <div className={styles["form-group"]}>
          <div className={styles["option-container"]}>
            <span className={styles["label"]}>
              Select a Number Group and Set How Many Must Appear
            </span>

            <label htmlFor="custom-numbers" className={styles["option-label"]}>
              Numbers in This Group
            </label>
            <NumArrInput
              id="custom-numbers"
              className={styles["option-child"]}
              value={input.customGroups}
              isInvalid={errorField === ERROR_FIELD_TOTO.CUSTOM_GROUPS}
              placeholder="e.g: 1,2,3"
              onChangeHandler={(val) =>
                setInput((prev) => ({ ...prev, customGroups: val }))
              }
            />

            <label htmlFor="custom-count" className={styles["custom-label"]}>
              Minimum Count
            </label>
            <Input
              id="custom-count"
              className={styles["option-child"]}
              type="number"
              min={0}
              max={12}
              value={input.customCount}
              isInvalid={errorField === ERROR_FIELD_TOTO.CUSTOM_COUNT}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  customCount: e.target.value,
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
                  customCount: e.target.value,
                }));
              }}
            />
          </div>
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
          <div className={`${styles["result-container"]}`}>
            {transitions((style, res, _, idx) => (
              <animated.div style={style} key={`toto-res-${idx}`}>
                <Container className={styles["result-wrapper"]}>
                  <div className={styles["res-header"]}>
                    <h2>
                      {idx + 1}) {res.combination}
                    </h2>
                    <div
                      className={styles["delete-wrapper"]}
                      onClick={() => deleteResultHandler(idx)}
                    >
                      <TrashbinIcon
                        fill="#e60026"
                        size={20}
                        className={styles["delete-icon"]}
                      />
                    </div>
                  </div>
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
                </Container>
              </animated.div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
};

export default TotoForm;
