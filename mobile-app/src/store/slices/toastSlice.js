import { createSlice } from '@reduxjs/toolkit';

const toastSlice = createSlice({
  name: 'toast',
  initialState: { items: [] },
  reducers: {
    addToast: (state, action) => {
      state.items.push({
        id: Date.now().toString(),
        ...action.payload,
        createdAt: Date.now(),
      });
      // Keep max 5 toasts
      if (state.items.length > 5) state.items = state.items.slice(-5);
    },
    removeToast: (state, action) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;
