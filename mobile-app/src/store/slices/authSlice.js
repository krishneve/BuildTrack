import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const user = await authService.login(email, password);
      return user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const restoreSession = createAsyncThunk(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getStoredUser();
      return user;
    } catch {
      return rejectWithValue(null);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    sessionRestored: false,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Restore
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.sessionRestored = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.sessionRestored = true;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
