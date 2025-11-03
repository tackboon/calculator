import { useEffect, useRef, useState } from "react";
import { useTransition, animated, useSpring } from "@react-spring/web";

import styles from "./toto.module.scss";
import {
  ERROR_FIELD_TOTO,
  TOTO_RANGE,
  TotoCombination,
  TotoInputType,
} from "./toto.type";
import {
  generateCombinations,
  getRangeGroupHeight,
  getRangeInfo,
} from "./utils";
import Button from "../../component/common/button/button.component";
import Container from "../../component/common/container/container.component";
import Input from "../../component/common/input/input.component";
import SelectBox from "../../component/common/select_box/select_box.component";
import NumArrInput from "../../component/common/input/num_arr_input.component";
import RangeInput from "../../component/common/input/range_input.component";
import TrashbinIcon from "../../component/common/icon/trashbin.component";
import Checkbox from "../../component/common/checkbox/checkbox.component";
import { validateTotoInput } from "./validation/validation";

const DEFAULT_INPUT: TotoInputType = {
  count: "1",
  system: 6,
  numberRange: TOTO_RANGE.FOURTY_NINE,
  includeNumberFilter: false,
  mustIncludes: "",
  mustExcludes: "",
  includeOddEven: false,
  odd: "",
  even: "",
  includeLowHigh: false,
  low: "",
  high: "",
  includeCustomGroup: false,
  customGroups: "",
  customCount: "",
  includeRangeGroup: false,
  rangeCount10: "",
  rangeCount20: "",
  rangeCount30: "",
  rangeCount40: "",
  rangeCount50: "",
  rangeCount60: "",
  rangeCount70: "",
};

const TotoForm = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<ERROR_FIELD_TOTO | null>(null);
  const [input, setInput] = useState<TotoInputType>(DEFAULT_INPUT);
  const [rangeGroupCount, setRangeGroupCount] = useState(3);

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
      includeLowHigh: prev.includeLowHigh,
      includeCustomGroup: prev.includeCustomGroup,
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

  const numberFilterStyles = useSpring({
    height: input.includeNumberFilter ? 200 : 0,
    opacity: input.includeNumberFilter ? 1 : 0,
    overflow: "hidden",
  });

  const oddEvenStyles = useSpring({
    height: input.includeOddEven ? 200 : 0,
    opacity: input.includeOddEven ? 1 : 0,
    overflow: "hidden",
  });

  const lowHighStyles = useSpring({
    height: input.includeLowHigh ? 200 : 0,
    opacity: input.includeLowHigh ? 1 : 0,
    overflow: "hidden",
  });

  const customStyles = useSpring({
    height: input.includeCustomGroup ? 200 : 0,
    opacity: input.includeCustomGroup ? 1 : 0,
    overflow: "hidden",
  });

  const rangeStyles = useSpring({
    height: getRangeGroupHeight(input.includeRangeGroup, rangeGroupCount),
    opacity: input.includeRangeGroup ? 1 : 0,
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
              setInput((prev) => ({ ...prev, system }));
            }}
          />
        </div>

        <div className={styles["form-group"]}>
          <span className={styles["label"]}>Number Range</span>
          <SelectBox
            id="range"
            options={["1-49", "1-50", "1-55", "1-58", "1-69"]}
            defaultIndex={input.numberRange}
            onChangeHandler={(idx) => {
              const rangeInfo = getRangeInfo(idx);
              setInput((prev) => ({ ...prev, numberRange: idx }));
              setRangeGroupCount(rangeInfo.group);
            }}
          />
        </div>

        <div
          className={styles["form-group"]}
          style={{
            marginTop: "2rem",
            marginBottom: input.includeNumberFilter ? "1.5rem" : "0.6rem",
          }}
        >
          <div className={styles["checkbox-wrapper"]}>
            <Checkbox
              id="number-filter-check"
              isCheck={input.includeNumberFilter}
              onCheck={() =>
                setInput((prev) => ({
                  ...prev,
                  includeNumberFilter: !input.includeNumberFilter,
                  mustIncludes: DEFAULT_INPUT.mustIncludes,
                  mustExcludes: DEFAULT_INPUT.mustExcludes,
                }))
              }
            />
            <span
              className={styles["checkbox-label"]}
              onClick={() =>
                setInput((prev) => ({
                  ...prev,
                  includeNumberFilter: !input.includeNumberFilter,
                  mustIncludes: DEFAULT_INPUT.mustIncludes,
                  mustExcludes: DEFAULT_INPUT.mustExcludes,
                }))
              }
            >
              Include Number Filter Rule
            </span>
          </div>
        </div>

        <animated.div style={numberFilterStyles}>
          {input.includeNumberFilter && (
            <>
              <div className={styles["form-group"]}>
                <label htmlFor="must-includes">Include These Numbers</label>
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
                <label htmlFor="must-excludes">Exclude These Numbers</label>
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
            </>
          )}
        </animated.div>

        <div
          className={styles["form-group"]}
          style={{
            marginBottom: input.includeCustomGroup ? "1.5rem" : "0.6rem",
          }}
        >
          <div className={styles["checkbox-wrapper"]}>
            <Checkbox
              id="custom-check"
              isCheck={input.includeCustomGroup}
              onCheck={() =>
                setInput((prev) => ({
                  ...prev,
                  includeCustomGroup: !input.includeCustomGroup,
                  customGroups: DEFAULT_INPUT.customGroups,
                  customCount: DEFAULT_INPUT.customCount,
                }))
              }
            />
            <span
              className={styles["checkbox-label"]}
              onClick={() =>
                setInput((prev) => ({
                  ...prev,
                  includeCustomGroup: !input.includeCustomGroup,
                  customGroups: DEFAULT_INPUT.customGroups,
                  customCount: DEFAULT_INPUT.customCount,
                }))
              }
            >
              Include Custom Group Rule
            </span>
          </div>
        </div>

        <animated.div style={customStyles}>
          {input.includeCustomGroup && (
            <>
              <div className={styles["form-group"]}>
                <label htmlFor="custom-numbers">Custom Group Numbers</label>
                <NumArrInput
                  id="custom-numbers"
                  value={input.customGroups}
                  isInvalid={errorField === ERROR_FIELD_TOTO.CUSTOM_GROUPS}
                  placeholder="e.g: 1,2,3"
                  onChangeHandler={(val) =>
                    setInput((prev) => ({ ...prev, customGroups: val }))
                  }
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="custom-count">Custom Number Count</label>
                <RangeInput
                  id="custom-count"
                  isInvalid={errorField === ERROR_FIELD_TOTO.CUSTOM_COUNT}
                  value={input.customCount}
                  placeholder="Enter a number or range (e.g. 1 or 1-6)"
                  onChangeHandler={(val) =>
                    setInput((prev) => ({ ...prev, customCount: val }))
                  }
                />
              </div>
            </>
          )}
        </animated.div>

        <div
          className={styles["form-group"]}
          style={{
            marginBottom: input.includeOddEven ? "1.5rem" : "0.6rem",
          }}
        >
          <div className={styles["checkbox-wrapper"]}>
            <Checkbox
              id="oddeven-check"
              isCheck={input.includeOddEven}
              onCheck={() =>
                setInput((prev) => ({
                  ...prev,
                  includeOddEven: !input.includeOddEven,
                  odd: DEFAULT_INPUT.odd,
                  even: DEFAULT_INPUT.even,
                }))
              }
            />
            <span
              className={styles["checkbox-label"]}
              onClick={() =>
                setInput((prev) => ({
                  ...prev,
                  includeOddEven: !input.includeOddEven,
                  odd: DEFAULT_INPUT.odd,
                  even: DEFAULT_INPUT.even,
                }))
              }
            >
              Include Odd/Even Rule
            </span>
          </div>
        </div>

        <animated.div style={oddEvenStyles}>
          {input.includeOddEven && (
            <>
              <div className={styles["form-group"]}>
                <label htmlFor="odd">Odd Count</label>
                <RangeInput
                  id="odd"
                  isInvalid={errorField === ERROR_FIELD_TOTO.ODD}
                  value={input.odd}
                  placeholder="Enter a number or range (e.g. 1 or 1-6)"
                  onChangeHandler={(val) =>
                    setInput((prev) => ({ ...prev, odd: val }))
                  }
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="even">Even Count</label>
                <RangeInput
                  id="even"
                  isInvalid={errorField === ERROR_FIELD_TOTO.EVEN}
                  value={input.even}
                  placeholder="Enter a number or range (e.g. 1 or 1-6)"
                  onChangeHandler={(val) =>
                    setInput((prev) => ({ ...prev, even: val }))
                  }
                />
              </div>
            </>
          )}
        </animated.div>

        <div
          className={styles["form-group"]}
          style={{ marginBottom: input.includeLowHigh ? "1.5rem" : "0.6rem" }}
        >
          <div className={styles["checkbox-wrapper"]}>
            <Checkbox
              id="lowhigh-check"
              isCheck={input.includeLowHigh}
              onCheck={() =>
                setInput((prev) => ({
                  ...prev,
                  includeLowHigh: !input.includeLowHigh,
                  low: DEFAULT_INPUT.low,
                  high: DEFAULT_INPUT.high,
                }))
              }
            />
            <span
              className={styles["checkbox-label"]}
              onClick={() =>
                setInput((prev) => ({
                  ...prev,
                  includeLowHigh: !input.includeLowHigh,
                  low: DEFAULT_INPUT.low,
                  high: DEFAULT_INPUT.high,
                }))
              }
            >
              Include Low/High Rule
            </span>
          </div>
        </div>

        <animated.div style={lowHighStyles}>
          {input.includeLowHigh && (
            <>
              <div className={styles["form-group"]}>
                <label htmlFor="low">Low Count</label>
                <RangeInput
                  id="low"
                  isInvalid={errorField === ERROR_FIELD_TOTO.LOW}
                  value={input.low}
                  placeholder="Enter a number or range (e.g. 1 or 1-6)"
                  onChangeHandler={(val) =>
                    setInput((prev) => ({ ...prev, low: val }))
                  }
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="high">High Count</label>
                <RangeInput
                  id="high"
                  isInvalid={errorField === ERROR_FIELD_TOTO.HIGH}
                  value={input.high}
                  placeholder="Enter a number or range (e.g. 1 or 1-6)"
                  onChangeHandler={(val) =>
                    setInput((prev) => ({ ...prev, high: val }))
                  }
                />
              </div>
            </>
          )}
        </animated.div>

        <div
          className={styles["form-group"]}
          style={{
            marginBottom: input.includeRangeGroup ? "1.5rem" : "0.6rem",
          }}
        >
          <div className={styles["checkbox-wrapper"]}>
            <Checkbox
              id="range-check"
              isCheck={input.includeRangeGroup}
              onCheck={() =>
                setInput((prev) => ({
                  ...prev,
                  includeRangeGroup: !input.includeRangeGroup,
                  rangeCount10: DEFAULT_INPUT.rangeCount10,
                  rangeCount20: DEFAULT_INPUT.rangeCount20,
                  rangeCount30: DEFAULT_INPUT.rangeCount30,
                  rangeCount40: DEFAULT_INPUT.rangeCount40,
                  rangeCount50: DEFAULT_INPUT.rangeCount50,
                  rangeCount60: DEFAULT_INPUT.rangeCount60,
                  rangeCount70: DEFAULT_INPUT.rangeCount70,
                }))
              }
            />
            <span
              className={styles["checkbox-label"]}
              onClick={() =>
                setInput((prev) => ({
                  ...prev,
                  includeRangeGroup: !input.includeRangeGroup,
                  rangeCount10: DEFAULT_INPUT.rangeCount10,
                  rangeCount20: DEFAULT_INPUT.rangeCount20,
                  rangeCount30: DEFAULT_INPUT.rangeCount30,
                  rangeCount40: DEFAULT_INPUT.rangeCount40,
                  rangeCount50: DEFAULT_INPUT.rangeCount50,
                  rangeCount60: DEFAULT_INPUT.rangeCount60,
                  rangeCount70: DEFAULT_INPUT.rangeCount70,
                }))
              }
            >
              Include Range Group Rule
            </span>
          </div>
        </div>

        <animated.div style={rangeStyles}>
          {input.includeRangeGroup && (
            <>
              {rangeGroupCount >= 1 && (
                <div className={styles["form-group"]}>
                  <label htmlFor="range-10">1-10</label>
                  <RangeInput
                    id="range-10"
                    isInvalid={errorField === ERROR_FIELD_TOTO.RANGE_10}
                    value={input.rangeCount10}
                    placeholder="Enter a number or range (e.g. 1 or 1-6)"
                    onChangeHandler={(val) =>
                      setInput((prev) => ({ ...prev, rangeCount10: val }))
                    }
                  />
                </div>
              )}

              {rangeGroupCount >= 2 && (
                <div className={styles["form-group"]}>
                  <label htmlFor="range-20">11-20</label>
                  <RangeInput
                    id="range-20"
                    isInvalid={errorField === ERROR_FIELD_TOTO.RANGE_20}
                    value={input.rangeCount20}
                    placeholder="Enter a number or range (e.g. 1 or 1-6)"
                    onChangeHandler={(val) =>
                      setInput((prev) => ({ ...prev, rangeCount20: val }))
                    }
                  />
                </div>
              )}

              {rangeGroupCount >= 3 && (
                <div className={styles["form-group"]}>
                  <label htmlFor="range-30">21-30</label>
                  <RangeInput
                    id="range-30"
                    isInvalid={errorField === ERROR_FIELD_TOTO.RANGE_30}
                    value={input.rangeCount30}
                    placeholder="Enter a number or range (e.g. 1 or 1-6)"
                    onChangeHandler={(val) =>
                      setInput((prev) => ({ ...prev, rangeCount30: val }))
                    }
                  />
                </div>
              )}

              {rangeGroupCount >= 4 && (
                <div className={styles["form-group"]}>
                  <label htmlFor="range-40">31-40</label>
                  <RangeInput
                    id="range-40"
                    isInvalid={errorField === ERROR_FIELD_TOTO.RANGE_40}
                    value={input.rangeCount40}
                    placeholder="Enter a number or range (e.g. 1 or 1-6)"
                    onChangeHandler={(val) =>
                      setInput((prev) => ({ ...prev, rangeCount40: val }))
                    }
                  />
                </div>
              )}

              {rangeGroupCount >= 5 && (
                <div className={styles["form-group"]}>
                  <label htmlFor="range-50">41-50</label>
                  <RangeInput
                    id="range-50"
                    isInvalid={errorField === ERROR_FIELD_TOTO.RANGE_50}
                    value={input.rangeCount50}
                    placeholder="Enter a number or range (e.g. 1 or 1-6)"
                    onChangeHandler={(val) =>
                      setInput((prev) => ({ ...prev, rangeCount50: val }))
                    }
                  />
                </div>
              )}

              {rangeGroupCount >= 6 && (
                <div className={styles["form-group"]}>
                  <label htmlFor="range-60">51-60</label>
                  <RangeInput
                    id="range-60"
                    isInvalid={errorField === ERROR_FIELD_TOTO.RANGE_60}
                    value={input.rangeCount60}
                    placeholder="Enter a number or range (e.g. 1 or 1-6)"
                    onChangeHandler={(val) =>
                      setInput((prev) => ({ ...prev, rangeCount60: val }))
                    }
                  />
                </div>
              )}

              {rangeGroupCount >= 7 && (
                <div className={styles["form-group"]}>
                  <label htmlFor="range-70">61-70</label>
                  <RangeInput
                    id="range-70"
                    isInvalid={errorField === ERROR_FIELD_TOTO.RANGE_70}
                    value={input.rangeCount70}
                    placeholder="Enter a number or range (e.g. 1 or 1-6)"
                    onChangeHandler={(val) =>
                      setInput((prev) => ({ ...prev, rangeCount70: val }))
                    }
                  />
                </div>
              )}
            </>
          )}
        </animated.div>

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
        {result && result.length > 0 && (
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
