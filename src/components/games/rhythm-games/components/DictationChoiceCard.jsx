import React, { useRef, useEffect } from 'react';
import { Renderer, Stave, Voice, Formatter, Beam, Stem } from 'vexflow';
import { beatsToVexNotes } from '../utils/rhythmVexflowHelpers';
import { beamGroupsForTimeSignature } from '../../sight-reading-game/utils/beamGroupUtils';

/**
 * DictationChoiceCard
 *
 * A selectable card that renders a VexFlow rhythm notation pattern.
 * Used in RhythmDictationGame for the 3-choice answer selection (RDICT-03).
 *
 * Props:
 * - beats: [{durationUnits, isRest}] — the pattern for this card
 * - timeSignature: string '4/4', '3/4', '2/4', '6/8'
 * - cardIndex: number 0, 1, or 2
 * - state: 'default' | 'correct' | 'wrong' | 'dimmed'
 * - onSelect: (cardIndex) => void — called when card is tapped
 * - disabled: boolean — prevent selection during feedback phase
 */

// Map visual states to Tailwind class strings per UI-SPEC choice card states table
const STATE_CLASSES = {
  default:
    'bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/40 cursor-pointer transition-colors duration-150',
  correct:
    'bg-green-500/20 backdrop-blur-md border-2 border-green-400 rounded-xl shadow-[0_0_12px_rgba(74,222,128,0.4)] transition-all duration-300',
  wrong:
    'bg-red-500/20 backdrop-blur-md border-2 border-red-400 rounded-xl transition-all duration-300',
  dimmed:
    'opacity-40 pointer-events-none bg-white/10 border border-white/20 rounded-xl',
};

/**
 * Parse time signature string to beat count (in quarter notes) for VexFlow Voice.
 */
function getBeatCount(timeSig) {
  const parts = timeSig.split('/');
  if (parts.length !== 2) return 4;
  const [num, den] = parts.map(Number);
  // For compound time (6/8): 6 eighth notes = 3 quarter-note beats
  if (den === 8) return num / 2;
  return num;
}

export function DictationChoiceCard({
  beats,
  timeSignature = '4/4',
  cardIndex,
  state = 'default',
  onSelect,
  disabled = false,
}) {
  const containerRef = useRef(null);

  // Render VexFlow notation whenever beats or timeSignature changes
  useEffect(() => {
    if (!containerRef.current || !beats || beats.length === 0) return;

    // Clear previous render
    containerRef.current.innerHTML = '';

    const containerWidth = containerRef.current.offsetWidth || 320;
    const staveWidth = containerWidth - 20;
    const staveHeight = 100;

    try {
      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      renderer.resize(containerWidth, staveHeight);
      const ctx = renderer.getContext();
      ctx.setFillStyle('#ffffff');
      ctx.setStrokeStyle('#ffffff');

      // Create stave with time signature
      const stave = new Stave(10, 5, staveWidth);
      stave.addTimeSignature(timeSignature);
      stave.setContext(ctx).draw();

      // Build VexFlow notes from beats
      const notes = beatsToVexNotes(beats);

      // Force stems up — rhythm-only display per D-01 convention
      notes.forEach((note) => {
        if (note.setStemDirection) {
          note.setStemDirection(Stem.UP);
        }
      });

      // Create voice
      const beatCount = getBeatCount(timeSignature);
      const voice = new Voice({ num_beats: beatCount, beat_value: 4 });
      voice.setStrict(false);
      voice.addTickables(notes);

      // Automatic beams — use Fraction-based groups for compound time
      const beamGroups = beamGroupsForTimeSignature(timeSignature);
      const beamConfig = beamGroups ? { groups: beamGroups } : {};
      const beams = Beam.generateBeams(notes, beamConfig);

      // Format and draw
      new Formatter().joinVoices([voice]).format([voice], staveWidth - 60);
      voice.draw(ctx, stave);
      beams.forEach((beam) => beam.setContext(ctx).draw());

      // Apply white fill to SVG elements to match glassmorphism dark theme
      const svgEl = containerRef.current.querySelector('svg');
      if (svgEl) {
        svgEl.querySelectorAll('path, line, rect').forEach((el) => {
          const fill = el.getAttribute('fill');
          const stroke = el.getAttribute('stroke');
          if (!fill || fill === 'black') el.setAttribute('fill', 'white');
          if (!stroke || stroke === 'black') el.setAttribute('stroke', 'white');
        });
        svgEl.querySelectorAll('text').forEach((el) => {
          el.setAttribute('fill', 'white');
        });
      }
    } catch (err) {
      console.warn('[DictationChoiceCard] VexFlow render error:', err);
    }
  }, [beats, timeSignature]);

  const handleClick = () => {
    if (!disabled && state !== 'dimmed' && onSelect) {
      onSelect(cardIndex);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && state !== 'dimmed') {
      e.preventDefault();
      onSelect?.(cardIndex);
    }
  };

  const stateClass = STATE_CLASSES[state] ?? STATE_CLASSES.default;

  return (
    <div
      role="button"
      tabIndex={disabled || state === 'dimmed' ? -1 : 0}
      aria-label={`Choice ${cardIndex + 1}`}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`w-full p-3 min-h-[96px] flex items-center justify-center ${stateClass}`}
      style={{ minHeight: '96px' }}
    >
      {/* VexFlow notation — always LTR regardless of app locale */}
      <div dir="ltr" className="w-full" ref={containerRef} style={{ minHeight: '80px' }} />
    </div>
  );
}

export default DictationChoiceCard;
