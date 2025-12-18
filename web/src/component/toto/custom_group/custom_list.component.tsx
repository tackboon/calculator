import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useTransition, animated } from "@react-spring/web";

import CustomGroup, { DEFAULT_CUSTOM_GROUP_INPUT } from "./custom.component";
import { CustomGroupInputType, ERROR_FIELD_CUSTOM_GROUP } from "./custom.type";

type CustomGroupListType = {
  addSignal: number;
  minGroupCount: number;
  submitHandler: (
    getCustomGroups: () => {
      customGroups: CustomGroupInputType[];
    }
  ) => void;
  resetSignal: number;
  errors: (ERROR_FIELD_CUSTOM_GROUP | null)[];
};

const CustomGroupList: FC<CustomGroupListType> = ({
  addSignal,
  minGroupCount,
  submitHandler,
  resetSignal,
  errors,
}) => {
  const generateKey = () => {
    return crypto.randomUUID();
  };

  const customsRef = useRef(
    Array.from({ length: minGroupCount }, (_, i) => {
      const key = generateKey();
      return {
        key,
        data: DEFAULT_CUSTOM_GROUP_INPUT,
      };
    })
  );
  const [groupsConfig, setGroupsConfig] = useState<
    {
      key: string;
      errorField: ERROR_FIELD_CUSTOM_GROUP | null;
    }[]
  >(
    Array.from({ length: minGroupCount }, (_, i) => {
      const key = generateKey();
      return {
        key,
        errorField: null,
      };
    })
  );

  useEffect(() => {
    submitHandler(() => {
      const datas: CustomGroupInputType[] = [];

      for (let i = 0; i < customsRef.current.length; i++) {
        const inputData = customsRef.current[i].data;
        datas.push(inputData);
      }

      return { customGroups: datas };
    });
  }, [submitHandler]);

  const addGroupHandler = useCallback(() => {
    const key = generateKey();
    customsRef.current.push({
      key: key,
      data: DEFAULT_CUSTOM_GROUP_INPUT,
    });
    setGroupsConfig((prev) => [...prev, { key: key, errorField: null }]);
  }, []);

  useEffect(() => {
    if (addSignal > 0) addGroupHandler();
  }, [addSignal, addGroupHandler]);

  useEffect(() => {
    if (groupsConfig.length < minGroupCount) addGroupHandler();
  }, [groupsConfig, minGroupCount, addGroupHandler]);

  const deleteGroup = (key: string) => {
    setGroupsConfig((prev) => {
      const updatedGroupsConfig = prev.filter((item) => item.key !== key);
      customsRef.current = customsRef.current.filter(
        (item) => item.key !== key
      );
      return updatedGroupsConfig;
    });
  };

  useEffect(() => {
    if (resetSignal > 0) {
      const key = generateKey();
      setGroupsConfig(() => {
        customsRef.current = [
          {
            key: key,
            data: DEFAULT_CUSTOM_GROUP_INPUT,
          },
        ];
        return [{ key: key, errorField: null }];
      });
    }
  }, [resetSignal]);

  useEffect(() => {
    for (let i = 0; i < errors.length; i++) {
      const key = customsRef.current[i].key;
      setGroupsConfig((prev) => {
        const newConfigs = prev.map((prevConfig) =>
          prevConfig.key === key
            ? {
                key: prevConfig.key,
                errorField: errors[i],
              }
            : prevConfig
        );
        return newConfigs;
      });
    }
  }, [errors]);

  const transitions = useTransition(groupsConfig, {
    from: { opacity: 0, height: 0 },
    enter: () => ({
      opacity: 1,
      height: 300,
    }),
    leave: () => [{ opacity: 0 }, { height: 0 }],
    keys: (item) => item.key,
    config: { duration: 400 },
  });

  return (
    <>
      {transitions((style, config, _, idx) => (
        <animated.div style={style} key={config.key}>
          <CustomGroup
            name={`Custom Group #${idx + 1}`}
            key={config.key}
            idx={idx}
            onInputChange={(inputData) => {
              customsRef.current = customsRef.current.map((data) =>
                data.key === config.key
                  ? { key: data.key, data: inputData }
                  : data
              );
            }}
            deleteHandler={() => deleteGroup(config.key)}
            errorField={config.errorField}
          />
        </animated.div>
      ))}
    </>
  );
};

export default CustomGroupList;
