import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  hydrated: false, // true once the stored session has been restored
};

const authSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.hydrated = true;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.hydrated = true;
    },
    setHydrated(state) {
      state.hydrated = true;
    },
  },
});

export const { login, logout, setHydrated } = authSlice.actions;

export default authSlice.reducer;
