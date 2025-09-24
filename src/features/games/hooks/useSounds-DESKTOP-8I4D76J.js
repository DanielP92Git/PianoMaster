import { useRef, useEffect } from "react";

/**
 * Custom hook for managing game sounds
 * @returns {Object} Sound playing functions and audio refs
 */
export function useSounds() {
  // Sound references
  const correctSound = useRef(null);
  const wrongSound = useRef(null);
  const victorySound = useRef(null);
  const gameOverSound = useRef(null);
  const pianoSound = useRef(null);

  // Initialize sounds on component mount
  useEffect(() => {
    try {
      // Possible paths to try for each sound file
      const possibleCorrectPaths = [
        "/sounds/correct.mp3",
        "./sounds/correct.mp3",
        "../sounds/correct.mp3",
        "../../sounds/correct.mp3",
        "/assets/sounds/correct.mp3",
        "correct.mp3",
      ];

      const possibleWrongPaths = [
        "/sounds/wrong.mp3",
        "./sounds/wrong.mp3",
        "../sounds/wrong.mp3",
        "../../sounds/wrong.mp3",
        "/assets/sounds/wrong.mp3",
        "wrong.mp3",
      ];

      const possibleVictoryPaths = [
        "/sounds/success-fanfare-trumpets.mp3",
        "./sounds/success-fanfare-trumpets.mp3",
        "../sounds/success-fanfare-trumpets.mp3",
        "../../sounds/success-fanfare-trumpets.mp3",
        "/assets/sounds/success-fanfare-trumpets.mp3",
        "success-fanfare-trumpets.mp3",
      ];

      const possibleGameOverPaths = [
        "/sounds/game-over.wav",
        "./sounds/game-over.wav",
        "../sounds/game-over.wav",
        "../../sounds/game-over.wav",
        "/assets/sounds/game-over.wav",
        "game-over.wav",
      ];

      const possiblePianoPaths = [
        "/sounds/piano/F4.mp3", // public/sounds/piano/F4.mp3
        "/public/sounds/piano/F4.mp3", // alternative public path
        "/assets/sounds/piano/F4.mp3", // assets directory in public
        "/src/assets/sounds/piano/F4.mp3", // original path (likely won't work)
        "/F4.mp3", // root level fallback
      ];

      // Load each sound by trying different paths
      const loadSound = (pathsArray, ref) => {
        for (const path of pathsArray) {
          try {
            console.log(`Attempting to load sound from: ${path}`);
            const audio = new Audio(path);
            audio.volume = 0.7;
            audio.load();
            ref.current = audio;
            console.log(`Successfully loaded sound from: ${path}`);
            break;
          } catch (e) {
            console.log(`Failed to load sound from ${path}:`, e);
            // Continue to the next path if this one failed
          }
        }
      };

      // Load all sounds
      loadSound(possibleCorrectPaths, correctSound);
      loadSound(possibleWrongPaths, wrongSound);
      loadSound(possibleVictoryPaths, victorySound);
      loadSound(possibleGameOverPaths, gameOverSound);
      loadSound(possiblePianoPaths, pianoSound);
    } catch (error) {
      console.error("Error initializing sounds:", error);
    }

    // Cleanup function
    return () => {
      [
        correctSound,
        wrongSound,
        victorySound,
        gameOverSound,
        pianoSound,
      ].forEach((ref) => {
        if (ref.current) {
          try {
            ref.current.pause();
            ref.current.src = "";
          } catch (e) {
            // Ignore errors during cleanup
          }
        }
      });
    };
  }, []);

  // Play piano sound for rhythm patterns
  const playPianoSound = (volume = 0.6) => {
    console.log("playPianoSound called with volume:", volume);
    try {
      if (pianoSound.current) {
        console.log("Piano sound ref exists, attempting to play");
        // Stop other sounds except piano (allow overlapping piano sounds)
        [correctSound, wrongSound, victorySound, gameOverSound].forEach(
          (ref) => {
            if (ref.current) {
              ref.current.pause();
              ref.current.currentTime = 0;
            }
          }
        );

        // Play piano sound
        pianoSound.current.volume = volume;
        pianoSound.current.currentTime = 0;
        const playPromise = pianoSound.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Piano sound played successfully");
            })
            .catch((error) => {
              console.error("Error playing piano sound:", error);
            });
        }
      } else {
        console.log("Piano sound ref is null - sound not loaded");
      }
    } catch (error) {
      console.error("Error in playPianoSound:", error);
    }
  };

  // Play correct answer sound
  const playCorrectSound = () => {
    try {
      if (correctSound.current) {
        // Stop other sounds
        [wrongSound, victorySound, gameOverSound].forEach((ref) => {
          if (ref.current) {
            ref.current.pause();
            ref.current.currentTime = 0;
          }
        });

        // Play correct sound
        correctSound.current.currentTime = 0;
        correctSound.current.play();
      }
    } catch (error) {
      console.error("Error playing 