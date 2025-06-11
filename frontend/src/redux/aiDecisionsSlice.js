import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Configure Axios to use the local backend API
axios.defaults.baseURL = 'http://localhost:5000/api';

// Async thunk to fetch AI decisions from backend API
export const fetchAIDecisions = createAsyncThunk(
  'aiDecisions/fetchAIDecisions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://localhost:5000/api/ai-decisions');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch AI decisions due to server error');
    }
  }
);

const aiDecisionsSlice = createSlice({
  name: 'aiDecisions',
  initialState: {
    decisions: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAIDecisions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAIDecisions.fulfilled, (state, action) => {
        state.loading = false;
        state.decisions = action.payload;
      })
      .addCase(fetchAIDecisions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch AI decisions';
      });
  },
});

export default aiDecisionsSlice.reducer;
