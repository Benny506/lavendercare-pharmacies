import { configureStore } from '@reduxjs/toolkit';
import userProfileReducer from '../features/userProfile/userProfileSlice';
import inventoryReducer from '../features/inventory/inventorySlice';

const store = configureStore({
  reducer: {
    userProfile: userProfileReducer,
    inventory: inventoryReducer,
  },
});

export default store;
