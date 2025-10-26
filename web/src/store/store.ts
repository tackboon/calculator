import { configureStore } from "@reduxjs/toolkit";
import logger from "redux-logger";
import createSagaMiddleware from "redux-saga";

import { rootReducer } from "./root_reducer";
import { rootSaga } from "./root_saga";

export type RootState = ReturnType<typeof rootReducer>;

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      sagaMiddleware,
      ...(process.env.NODE_ENV !== "production" ? [logger] : [])
    ),
});

sagaMiddleware.run(rootSaga);
