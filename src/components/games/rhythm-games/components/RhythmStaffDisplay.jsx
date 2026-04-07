import React, { useRef, useEffect } from "react";
import { Renderer, Stave, Voice, Formatter, Beam, Stem } from "vexflow";
import { beatsToVexNotes } from "../utils/rhythmVexflowHelpers";
import { beamGroupsForTimeSignature } from "../../sight-reading-game/utils/beamGroupUtils";

/**
 * RhythmStaffDisplay
 *
 * VexFlow rhythm-only notation renderer with an overlaid cursor line.
 * All notes are placed on b/4 (mid-staff treble position) with stems up
 * per D-01: static staff with moving highlight cursor.
 *
 * Props:
 * - beats: [{durationUnits, isRest}] from binaryPatternToBeats — single measure (backward compat)
 * - measures: [[{durationUnits, isRest}, ...], [...]] — NEW: multi-measure array
 * - timeSignature: string '4/4', '3/4', '2/4', '6/8'
 * - cursorProgress: number 0-1 (0=left, 1=right) — cursor position
 * - tapResults: [{noteIdx, quality: 'PERFECT'|'GOOD'|'MISS'}] for coloring notes
 * - showCursor: boolean — show/hide cursor overlay
 * - reducedMotion: boolean from AccessibilityContext
 * - onStaveBoundsReady: callback with stave bounds info for parent cursor control
 */
export function RhythmStaffDisplay({
  beats,
  measures,
  timeSignature = "4/4",
  cursorProgress = 0,
  tapResults = [],
  showCursor = false,
  reducedMotion = false,
  onStaveBoundsReady = null,
  showSyllables = false,
  language = "en",
}) {
  const containerRef = useRef(null);
  const cursorDivRef = useRef(null);
  const noteElementsRef = useRef([]);

  // Parse time signature string into beats numerator/denominator
  const parseTimeSignature = (timeSig) => {
    const parts = timeSig.split("/");
    if (parts.length === 2) {
      return {
        numerator: parseInt(parts[0], 10),
        denominator: parseInt(parts[1], 10),
      };
    }
    return { numerator: 4, denominator: 4 };
  };

  // Calculate total beat count for Voice based on time signature
  const getBeatCount = (timeSig) => {
    const { numerator, denominator } = parseTimeSignature(timeSig);
    // Voice needs beat count in quarter notes
    if (denominator === 8) {
      // For 6/8: 6 eighth notes = 3 quarter notes (in terms of beat value)
      return numerator / 2;
    }
    return numerator;
  };

  // Render VexFlow notation when beats/measures or timeSignature changes
  useEffect(() => {
    if (!containerRef.current) return;

    // Normalize to measures array format
    const measuresData = measures
      ? measures // multi-measure mode
      : beats
        ? [beats]
        : []; // single-measure backward compat: wrap beats in an array
    if (measuresData.length === 0 || measuresData[0].length === 0) return;

    // Clear previous rendering
    containerRef.current.innerHTML = "";
    noteElementsRef.current = [];

    const containerWidth = containerRef.current.offsetWidth || 400;
    const measureCount = measuresData.length;
    const staveWidth = Math.floor((containerWidth - 20) / measureCount);
    const staveHeight = 120;

    try {
      // Create SVG renderer
      const renderer = new Renderer(
        containerRef.current,
        Renderer.Backends.SVG
      );
      renderer.resize(containerWidth, staveHeight);
      const ctx = renderer.getContext();
      ctx.setFillStyle("#ffffff");
      ctx.setStrokeStyle("#ffffff");

      const allNotes = []; // Flat array of all StaveNote objects for cursor/tap mapping

      for (let m = 0; m < measureCount; m++) {
        const measureBeats = measuresData[m];
        const xOffset = 10 + m * staveWidth;

        const stave = new Stave(xOffset, 10, staveWidth);
        // Only show time signature on first stave
        if (m === 0) stave.addTimeSignature(timeSignature);
        stave.setContext(ctx).draw();

        // Build VexFlow notes for this measure (pass syllable options)
        const notes = beatsToVexNotes(measureBeats, {
          showSyllables,
          language,
        });

        // Force stems up for all notes (rhythm-only display)
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

        // Generate automatic beams — use Fraction-based groups for compound time
        const beamGroups = beamGroupsForTimeSignature(timeSignature);
        const beamConfig = beamGroups ? { groups: beamGroups } : {};
        const beams = Beam.generateBeams(notes, beamConfig);

        // Format and draw
        new Formatter().joinVoices([voice]).format([voice], staveWidth - 80);
        voice.draw(ctx, stave);
        beams.forEach((beam) => beam.setContext(ctx).draw());

        // Collect notes for global indexing (cursor + tap results)
        notes.forEach((note) => {
          allNotes.push(note);
        });
      }

      // Expose stave note-area bounds + per-note X positions for beat-accurate cursor
      if (onStaveBoundsReady) {
        const noteXPositions = allNotes
          .map((note) => {
            try {
              return note.getAbsoluteX();
            } catch {
              return null;
            }
          })
          .filter((x) => x !== null);
        onStaveBoundsReady({
          noteStartX: 10, // first stave left edge
          noteEndX: containerWidth - 10, // last stave right edge
          containerWidth: containerRef.current?.offsetWidth || containerWidth,
          noteXPositions,
        });
      }

      // Store note SVG elements for color updates (flat across all measures)
      noteElementsRef.current = allNotes.map((note) => {
        try {
          return note.getElem ? note.getElem() : null;
        } catch {
          return null;
        }
      });

      // Style SVG elements to match glassmorphism theme
      const svgEl = containerRef.current.querySelector("svg");
      if (svgEl) {
        svgEl.querySelectorAll("path, line, rect").forEach((el) => {
          if (!el.getAttribute("fill") || el.getAttribute("fill") === "black") {
            el.setAttribute("fill", "white");
          }
          if (
            !el.getAttribute("stroke") ||
            el.getAttribute("stroke") === "black"
          ) {
            el.setAttribute("stroke", "white");
          }
        });
        // Text (time signature, etc.) should be white
        svgEl.querySelectorAll("text").forEach((el) => {
          el.setAttribute("fill", "white");
        });
      }
    } catch (err) {
      console.warn("[RhythmStaffDisplay] VexFlow render error:", err);
    }
  }, [beats, measures, timeSignature, showSyllables, language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update note colors based on tap results
  useEffect(() => {
    if (!tapResults || tapResults.length === 0) return;

    tapResults.forEach(({ noteIdx, quality }) => {
      const noteEl = noteElementsRef.current[noteIdx];
      if (!noteEl) return;

      let color;
      switch (quality) {
        case "PERFECT":
          color = "#4ade80"; // green-400
          break;
        case "GOOD":
          color = "#facc15"; // yellow-400
          break;
        case "MISS":
          color = "#f87171"; // red-400
          break;
        default:
          color = "white";
      }

      // Update all path elements within this note's SVG group
      try {
        noteEl.querySelectorAll("path, .vf-notehead path").forEach((el) => {
          el.setAttribute("fill", color);
          el.setAttribute("stroke", color);
        });
      } catch {
        // Note element may not have querySelectorAll in test environments
      }
    });
  }, [tapResults]);

  // Update cursor position directly via DOM (not React state — Pitfall 3: avoid re-renders)
  useEffect(() => {
    if (cursorDivRef.current) {
      cursorDivRef.current.style.left = `${cursorProgress * 100}%`;
    }
  }, [cursorProgress]);

  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
      {/* Music notation is always LTR regardless of app locale */}
      <div dir="ltr" style={{ position: "relative" }}>
        {/* VexFlow rendering container */}
        <div ref={containerRef} style={{ width: "100%", minHeight: "120px" }} />

        {/* Cursor overlay line */}
        {showCursor && (
          <div
            ref={cursorDivRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: `${cursorProgress * 100}%`,
              width: "2px",
              height: "100%",
              backgroundColor: "rgb(129, 140, 248)", // indigo-400
              opacity: 0.8,
              boxShadow: reducedMotion
                ? "none"
                : "0 0 8px rgba(129,140,248,0.8)",
              pointerEvents: "none",
              zIndex: 10,
            }}
            className="bg-indigo-400"
          />
        )}
      </div>
    </div>
  );
}

export default RhythmStaffDisplay;
