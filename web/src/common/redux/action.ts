import { UnknownAction } from "@reduxjs/toolkit";

export type Action<T> = { type: T };
export const createAction = <T extends string>(type: T): Action<T> => ({ type });

export type ActionWithPayload<T, P> = { type: T; payload: P };
export const createActionWithPayload = <T extends string, P>(
  type: T,
  payload: P
): ActionWithPayload<T, P> => ({ type, payload });

type Matchable<AC extends (...args: any[]) => UnknownAction> = AC & {
  type: ReturnType<AC>["type"];
  match(action: UnknownAction): action is ReturnType<AC>;
};

export const withMatcher = <AC extends (...args: any[]) => UnknownAction>(
  actionCreator: AC
): Matchable<AC> => {
  const type = actionCreator().type;
  return Object.assign(actionCreator, {
    type,
    match(action: UnknownAction): action is ReturnType<AC> {
      return action.type === type;
    },
  });
};
