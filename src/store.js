// filepath: /src/store.js
import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { rhythmReducer } from "./reducers/rhythmReducer";

const rootReducer = combineReducers({
  rhythm: rhythmReducer,
});

const store = configureStore({
    reducer: rootReducer,
});

export default store;
