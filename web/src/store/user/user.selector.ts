import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "../store";
import { UserState } from "./user.reducer";

export const selectUserReducer = (state: RootState): UserState => state.user;

export const selectCurrentUser = createSelector(selectUserReducer, (user) => {
  return user.currentUser;
});

export const selectUserError = createSelector(
  selectUserReducer,
  (user) => user.error
);

export const selectUserIsLoading = createSelector(
  selectUserReducer,
  (user) => user.isLoading
);

export const selectUserStatus = createSelector(
  selectUserReducer,
  (user) => user.status
);
