import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useTransition, animated } from "@react-spring/web";

import Order, { DEFAULT_STOCK_ORDER_INPUT } from "./order.component";
import { validateOrderInput } from "./order_utils.component";
import { ERROR_FIELD_STOCK_ORDER, StockOrderInputType } from "./order.type";

type StockOrderListType = {
  addOrderSignal: number;
  minOrderCount: number;
  submitHandler: (
    getOrders: () => { orders: StockOrderInputType[]; errorMessage: string }
  ) => void;
  resetSignal: number;
};

const StockOrderList: FC<StockOrderListType> = ({
  addOrderSignal,
  minOrderCount,
  submitHandler,
  resetSignal,
}) => {
  const generateKey = (timeMs: number, suffix = 0) => {
    return `${timeMs}-${suffix}`;
  };

  const startTime = Date.now();
  const ordersRef = useRef(
    Array.from({ length: minOrderCount }, (_, i) => {
      const key = generateKey(startTime, i);
      return {
        key,
        data: DEFAULT_STOCK_ORDER_INPUT,
      };
    })
  );
  const [ordersConfig, setOrdersConfig] = useState<
    {
      key: string;
      includeProfitGoal: boolean;
      errorField: ERROR_FIELD_STOCK_ORDER | null;
    }[]
  >(
    Array.from({ length: minOrderCount }, (_, i) => {
      const key = generateKey(startTime, i);
      return {
        key,
        includeProfitGoal: false,
        errorField: null,
      };
    })
  );

  useEffect(() => {
    submitHandler(() => {
      let errMsg = "";
      const datas: StockOrderInputType[] = [];
      const updatedConfigs = new Map<string, ERROR_FIELD_STOCK_ORDER | null>();

      for (let i = 0; i < ordersRef.current.length; i++) {
        const orderKey = ordersRef.current[i].key;
        const inputData = ordersRef.current[i].data;
        const { err, field } = validateOrderInput(inputData);
        updatedConfigs.set(orderKey, field);

        if (err !== "" && errMsg === "") {
          errMsg = err;
        }

        datas.push(inputData);
      }

      setOrdersConfig((prevConfigs) =>
        prevConfigs.map((conf) => ({
          ...conf,
          errorField: updatedConfigs.get(conf.key) ?? null,
        }))
      );

      return { orders: errMsg === "" ? datas : [], errorMessage: errMsg };
    });
  }, [submitHandler]);

  const addOrderHandler = useCallback(() => {
    const key = generateKey(Date.now());
    ordersRef.current.push({
      key: key,
      data: DEFAULT_STOCK_ORDER_INPUT,
    });
    setOrdersConfig((prevOrdersConfig) => [
      ...prevOrdersConfig,
      { key: key, includeProfitGoal: false, errorField: null },
    ]);
  }, []);

  useEffect(() => {
    if (addOrderSignal > 0) addOrderHandler();
  }, [addOrderSignal, addOrderHandler]);

  useEffect(() => {
    if (ordersConfig.length < minOrderCount) addOrderHandler();
  }, [ordersConfig, minOrderCount, addOrderHandler]);

  const deleteOrder = (key: string) => {
    setOrdersConfig((prevOrdersConfig) => {
      const updatedOrdersConfig = prevOrdersConfig.filter(
        (item) => item.key !== key
      );
      ordersRef.current = ordersRef.current.filter((item) => item.key !== key);
      return updatedOrdersConfig;
    });
  };

  useEffect(() => {
    if (resetSignal > 0) {
      setOrdersConfig(() => {
        ordersRef.current = [];
        return [];
      });
    }
  }, [resetSignal]);

  const transitions = useTransition(ordersConfig, {
    from: { opacity: 0, height: 0 },
    enter: (item) => ({
      opacity: 1,
      height: item.includeProfitGoal ? 660 : 560,
    }),
    leave: () => ({ opacity: 0, height: 0 }),
    keys: (item) => item.key,
    update: (item) => ({
      height: item.includeProfitGoal ? 660 : 560,
    }),
    config: { duration: 500, easing: (t) => t * t * (3 - 2 * t) },
  });

  return (
    <>
      {transitions((style, config, _, idx) => (
        <animated.div style={style} key={config.key}>
          <Order
            name={`Order #${idx + 1}`}
            key={config.key}
            idx={idx}
            onInputChange={(inputData) => {
              ordersRef.current = ordersRef.current.map((data) => {
                if (data.key === config.key) {
                  if (
                    data.data.includeProfitGoal !== inputData.includeProfitGoal
                  ) {
                    setOrdersConfig((prevOrdersConfig) => {
                      const newConfigs = prevOrdersConfig.map((prevConfig) =>
                        prevConfig.key === config.key
                          ? {
                              key: prevConfig.key,
                              includeProfitGoal: inputData.includeProfitGoal,
                              errorField: prevConfig.errorField,
                            }
                          : prevConfig
                      );
                      return newConfigs;
                    });
                  }
                  return {
                    key: data.key,
                    data: inputData,
                  };
                }
                return data;
              });
            }}
            deleteHandler={() => deleteOrder(config.key)}
            errorField={config.errorField}
          />
        </animated.div>
      ))}
    </>
  );
};

export default StockOrderList;
