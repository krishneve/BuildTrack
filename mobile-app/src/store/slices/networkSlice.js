import { createSlice } from '@reduxjs/toolkit';

const networkSlice = createSlice({
  name: 'network',
  initialState: { isConnected: true, pendingCount: 0 },
  reducers: {
    setConnected: (state, action) => { state.isConnected = action.payload; },
    setPendingCount: (state, action) => { state.pendingCount = action.payload; },
  },
});

export const { setConnected, setPendingCount } = networkSlice.actions;
export default networkSlice.reducer;
