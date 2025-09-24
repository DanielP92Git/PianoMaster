# Game Sound Files

This directory should contain sound effect files used in the app's games and interfaces.

## Required Sound Files

The following sound files need to be added to this directory:

1. `correct.mp3` - Played when the user gives a correct answer in games
2. `wrong.mp3` - Played when the user gives an incorrect answer in games
3. `success-fanfare-trumpets.mp3` - Played when the user successfully completes a game or level
4. `game-over.mp3` - Played when the user fails a game or runs out of time

## Sound Resources

You can obtain free sound effects from the following sources:

1. [Freesound.org](https://freesound.org/) - A collaborative database of Creative Commons Licensed sounds
2. [Mixkit](https://mixkit.co/free-sound-effects/) - Free sound effects for games, apps, and videos
3. [ZapSplat](https://www.zapsplat.com/) - Free sound effects library

## Sound Optimization

For optimal performance in a mobile app:

1. Keep file sizes small (ideally under 100KB per sound)
2. Use a consistent volume level across all samples
3. Use mono instead of stereo if possible to reduce file size
4. Trim any unnecessary silence at the beginning and end of samples
5. Consider using MP3 format at 128kbps or lower for all sound effects

## Implementation Note

The game sounds are loaded using the Expo Audio API in the `useSounds` hook. Make sure you have the necessary sound files in this directory before running the app, or you'll see errors in the console.
