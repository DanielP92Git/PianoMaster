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

      // Load each sound by trying different paths
      const loadSound = (pathsArray, ref) => {
        for (const path of pathsArray) {
          try {
            const audio = new Audio(path);
            audio.volume = 0.7;
            audio.load();
            ref.current = audio;
            break;
          } catch (e) {
            // Continue to the next path if this one failed
          }
        }
      };

      // Load all sounds
      loadSound(possibleCorrectPaths, correctSound);
      loadSound(possibleWrongPaths, wrongSound);
      loadSound(possibleVictoryPaths, victorySound);
      loadSound(possibleGameOverPaths, gameOverSound);
    } catch (error) {
      console.error("Error initializing sounds:", error);
    }

    // Cleanup function
    return () => {
      [correctSound, wrongSound, victorySound, gameOverSound].forEach((ref) => {
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
      console.error("Error playing correct sound:", error);
    }
  };

  // Play wrong answer sound
  const playWrongSound = () => {
    try {
      if (wrongSound.current) {
        // Stop other sounds
        [correctSound, victorySound, gameOverSound].forEach((ref) => {
          if (ref.current) {
            ref.current.pause();
            ref.current.currentTime = 0;
          }
        });

        // Play wrong sound
        wrongSound.current.currentTime = 0;
        wrongSound.current.play();
      }
    } catch (error) {
      console.error("Error playing wrong sound:", error);
    }
  };

  // Play victory sound
  const playVictorySound = () => {
    try {
      if (victorySound.current) {
        // Stop other sounds
        [correctSound, wrongSound, gameOverSound].forEach((ref) => {
          if (ref.current) {
            ref.current.pause();
            ref.current.currentTime = 0;
          }
        });

        // Play victory sound
        victorySound.current.currentTime = 0;
        victorySound.current.play();
      }
    } catch (error) {
      console.error("Error playing victory sound:", error);
    }
  };

  // Play game over sound
  const playGameOverSound = () => {
    try {
      if (gameOverSound.current) {
        // Stop other sounds
        [correctSound, wrongSound, victorySound].forEach((ref) => {
          if (ref.current) {
            ref.current.pause();
            ref.current.currentTime = 0;
          }
        });

        // Play game over sound
        gameOverSound.current.currentTime = 0;
        gameOverSound.current.play();
      }
    } catch (error) {
      console.error("Error playing game over sound:", error);
    }
  };

  // Return the audio refs and play functions
  return {
    soundRefs: {
      correctSound,
      wrongSound,
      victorySound,
      gameOverSound,
    },
    playCorrectSound,
    playWrongSound,
    playVictorySound,
    playGameOverSound,
  };
}
