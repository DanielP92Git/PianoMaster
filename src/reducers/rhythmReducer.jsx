import React, { createContext, useContext, useReducer } from "react";

const RhythmContext = createContext(null);
const RhythmDispatchContext = createContext(null);

const initialState = {
  selectedRhythms: ["basic"],
  timeSignature: "4/4",
  numberOfBars: 4,
  composition: Array(4).fill([]),
  settings: {
    isSidebarOpen: false,
  },
  gameProgress: {
    score: 0,
    completedExercises: 0,
  },
};

export const rhythmReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_SELECTED_RHYTHMS":
      return { ...state, selectedRhythms: action.payload };
    case "SET_TIME_SIGNATURE":
      return { ...state, timeSignature: action.payload };
    case "SET_NUMBER_OF_BARS":
      return {
        ...state,
        numberOfBars: action.payload,
        composition:
          action.payload < state.composition.length
            ? state.composition.slice(0, action.payload)
            : [
                ...state.composition,
                ...Array(action.payload - state.composition.length).fill([]),
              ],
      };
    case "ADD_RHYTHM":
      const newComposition = [...state.composition];
      newComposition[action.payload.barIndex] = [
        ...newComposition[action.payload.barIndex],
        action.payload.rhythm,
      ];
      return { ...state, composition: newComposition };
    case "REMOVE_NOTE":
      const updatedComposition = [...state.composition];
      updatedComposition[action.payload.barIndex] = [
        ...state.composition[action.payload.barIndex].slice(
          0,
          action.payload.noteIndex
        ),
        ...state.composition[action.payload.barIndex].slice(
          action.payload.noteIndex + 1
        ),
      ];
      return { ...state, composition: updatedComposition };
    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        settings: {
          ...state.settings,
          isSidebarOpen: !state.settings.isSidebarOpen,
        },
      };
    case "UPDATE_GAME_PROGRESS":
      return {
        ...state,
        gameProgress: {
          ...state.gameProgress,
          score: state.gameProgress.score + action.payload.score,
          completedExercises:
            state.gameProgress.completedExercises +
            action.payload.completedExercises,
        },
      };
    default:
      return state;
  }
};

export function RhythmProvider({ children }) {
  const [state, dispatch] = useReducer(rhythmReducer, initialState);

  return (
    <RhythmContext.Provider value={state}>
      <RhythmDispatchContext.Provider value={dispatch}>
        {children}
      </RhythmDispatchContext.Provider>
    </RhythmContext.Provider>
  );
}

export function useRhythm() {
  const context = useContext(RhythmContext);
  if (context === undefined) {
    throw new Error("useRhythm must be used within a RhythmProvider");
  }
  return context;
}

export function useRhythmDispatch() {
  const context = useContext(RhythmDispatchContext);
  if (context === undefined) {
    throw new Error("useRhythmDispatch must be used within a RhythmProvider");
  }
  return context;
}
