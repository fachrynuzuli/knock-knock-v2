import { configureStore } from '@reduxjs/toolkit';
import activitiesReducer from './slices/activitiesSlice';
import gameStateReducer from './slices/gameStateSlice';
import teammatesReducer from './slices/teammatesSlice';

export const store = configureStore({
  reducer: {
    activities: activitiesReducer,
    gameState: gameStateReducer,
    teammates: teammatesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;