import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk to fetch simulation state and results from backend API
export const fetchSimulationState = createAsyncThunk(
  'simulation/fetchSimulationState',
  async (restaurantType, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:5000/api/simulations/init', { restaurantType });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to initialize simulation');
    }
  }
);

// Async thunk to advance simulation day
export const advanceSimulationDay = createAsyncThunk(
  'simulation/advanceSimulationDay',
  async (state, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:5000/api/simulations/advance', { state });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to advance simulation day');
    }
  }
);

// Async thunk to evaluate simulation outcomes
export const evaluateSimulation = createAsyncThunk(
  'simulation/evaluateSimulation',
  async (state, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:5000/api/simulations/evaluate', { state });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to evaluate simulation');
    }
  }
);

const simulationSlice = createSlice({
  name: 'simulation',
  initialState: {
    state: null,
    history: [],
    outcomes: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetSimulation: (state) => {
      state.state = null;
      state.history = [];
      state.outcomes = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchSimulationState
      .addCase(fetchSimulationState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSimulationState.fulfilled, (state, action) => {
        state.loading = false;
        state.state = action.payload;
        state.history = [action.payload];
      })
      .addCase(fetchSimulationState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to initialize simulation';
      })
      // Handle advanceSimulationDay
      .addCase(advanceSimulationDay.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(advanceSimulationDay.fulfilled, (state, action) => {
        state.loading = false;
        state.state = action.payload;
        state.history.push(action.payload);
      })
      .addCase(advanceSimulationDay.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to advance simulation day';
      })
      // Handle evaluateSimulation
      .addCase(evaluateSimulation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(evaluateSimulation.fulfilled, (state, action) => {
        state.loading = false;
        state.outcomes.push({
          day: state.state?.day || state.history.length,
          revenueImpact: action.payload.revenueImpact,
          satisfactionChange: action.payload.satisfactionChange,
        });
      })
      .addCase(evaluateSimulation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to evaluate simulation';
      });
  },
});

export const { resetSimulation } = simulationSlice.actions;
export default simulationSlice.reducer;
