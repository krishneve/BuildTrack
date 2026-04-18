import { configureStore } from '@reduxjs/toolkit';
import authReducer    from './slices/authSlice';
import networkReducer from './slices/networkSlice';
import toastReducer   from './slices/toastSlice';

export const store = configureStore({
  reducer: {
    auth:    authReducer,
    network: networkReducer,
    toast:   toastReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});
