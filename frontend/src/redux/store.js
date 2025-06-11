import { configureStore } from '@reduxjs/toolkit';
import aiDecisionsReducer from './aiDecisionsSlice';
import simulationReducer from './simulationSlice';

export default configureStore({
  reducer: {
    aiDecisions: aiDecisionsReducer,
    simulation: simulationReducer,
  },
});
