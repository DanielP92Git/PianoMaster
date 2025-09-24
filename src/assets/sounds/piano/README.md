# Piano Sound Files

This directory should contain high-quality piano note samples for all notes in the piano. The sound engine is currently configured to use the following octaves:

- Octave 3 (low)
- Octave 4 (middle)
- Octave 5 (high)

## Required File Format

All sound files should be in MP3 format with the following naming convention:

- Natural notes: `[NOTE][OCTAVE].mp3` (e.g., `C4.mp3`, `D4.mp3`, etc.)
- Sharp notes: `[NOTE]s[OCTAVE].mp3` (e.g., `Cs4.mp3` for C#, `Fs4.mp3` for F#, etc.)

## Complete List of Required Files

### Octave 3

- C3.mp3
- Cs3.mp3 (C#)
- D3.mp3
- Ds3.mp3 (D#)
- E3.mp3
- F3.mp3
- Fs3.mp3 (F#)
- G3.mp3
- Gs3.mp3 (G#)
- A3.mp3
- As3.mp3 (A#)
- B3.mp3

### Octave 4 (Middle)

- C4.mp3
- Cs4.mp3 (C#)
- D4.mp3
- Ds4.mp3 (D#)
- E4.mp3
- F4.mp3
- Fs4.mp3 (F#)
- G4.mp3
- Gs4.mp3 (G#)
- A4.mp3
- As4.mp3 (A#)
- B4.mp3

### Octave 5

- C5.mp3
- Cs5.mp3 (C#)
- D5.mp3
- Ds5.mp3 (D#)
- E5.mp3
- F5.mp3
- Fs5.mp3 (F#)
- G5.mp3
- Gs5.mp3 (G#)
- A5.mp3
- As5.mp3 (A#)
- B5.mp3

## Sound Resources

You can obtain free piano sound samples from the following sources:

1. [Freesound.org](https://freesound.org/search/?q=piano+note) - Search for "piano note" and filter for high-quality samples.
2. [University of Iowa Electronic Music Studios](http://theremin.music.uiowa.edu/MISpiano.html) - Professional recordings of various instruments including piano.
3. [Philharmonia Orchestra](https://philharmonia.co.uk/resources/sound-samples/) - High-quality samples of orchestral instruments.

## Sound Optimization

For optimal performance in a mobile app:

1. Keep file sizes small (ideally under 100KB per note)
2. Use a consistent volume level across all samples
3. Use mono instead of stereo if possible to reduce file size
4. Trim any unnecessary silence at the beginning and end of samples
5. Consider using a compression tool to optimize MP3 files

## Implementation Note

Until you add the actual sound files, the sound engine is configured to use files from the middle octave (Octave 4) for all other octaves. This is a temporary solution to allow testing of the sound engine functionality.

Once you have the proper sound files, update the `notePaths` object in `utils/soundEngine.js` to use the actual file paths instead of the fallback paths.
