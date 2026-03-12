import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  session: null,
  user: null,
  profile: null,
  isLoading: true,
};

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    setSession: (state, action) => {
      state.session = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    clearUserProfile: (state) => {
      state.session = null;
      state.user = null;
      state.profile = null;
      state.isLoading = false;
    },
  },
});

export const { setSession, setUser, setProfile, setIsLoading, clearUserProfile } = userProfileSlice.actions;

export default userProfileSlice.reducer;
