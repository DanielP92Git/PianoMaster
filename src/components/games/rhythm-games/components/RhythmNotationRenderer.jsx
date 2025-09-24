import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/Card";

/**
 * Rhythm Notation Renderer Component
 * Displays standard music notation for rhythm patterns using Canvas
 */
export function RhythmNotationRenderer({
  pattern = [],
  timeSignature = { name: "4/4", beats: 4 },
  currentBeat = -1,
  isPlaying = false,
  title = "Rhythm Notation",
  className = "",
  width = 600,
  height = 150,
}) {
  const canvasRef = useRef(null);

  // Draw the notation whenever pattern or currentBeat changes
  useEffect(() => {
    if (!canvasRef.current || !pattern.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    drawNotation(ctx, pattern, timeSignature, currentBeat, isPlaying);
  }, [pattern, timeSignature, currentBeat, isPlaying, width, height]);

  /**
   * Draw the complete rhythm notation
   */
  const drawNotation = (ctx, pattern, timeSignature, currentBeat, isPlaying) => {
    const margin = 40;
    const staffY = height / 2;
    const staffWidth = width - 2 * margin;
    const noteSpacing = staffWidth / pattern.length;

    // Draw staff lines (5 lines for standard staff)
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const y = staffY - 40 + i * 20;
      ctx.moveTo(margin, y);
      ctx.lineTo(width - margin, y);
    }
    ctx.stroke();

    // Draw time signature at the beginning
    drawTimeSignature(ctx, timeSignature, margin + 10, staffY);

    // Draw measure lines
    drawMeasureLines(ctx, pattern, margin, staffY, noteSpacing);

    // Draw notes and rests
    drawNotesAndRests(ctx, pattern, margin, staffY, noteSpacing, currentBeat, isPlaying);
  };

  /**
   * Draw time signature
   */
  const drawTimeSignature = (ctx, timeSignature, x, centerY) => {
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";

    const [numerator, denominator] = timeSignature.name.split("/");
    
    // Draw numerator
    ctx.fillText(numerator, x, centerY - 15);
    
    // Draw denominator
    ctx.fillText(denominator, x, centerY + 15);
  };

  /**
   * Draw measure lines
   */
  const drawMeasureLines = (ctx, pattern, startX, centerY, noteSpacing) => {
    ctx.beginPath();
    ctx.lineWidth = 3;
    
    // Starting bar line
    ctx.moveTo(startX + 30, centerY - 40);
    ctx.lineTo(startX + 30, centerY + 40);
    
    // Ending bar line
    const endX = startX + 30 + pattern.length * noteSpacing;
    ctx.moveTo(endX, centerY - 40);
    ctx.lineTo(endX, centerY + 40);
    
    ctx.stroke();
    ctx.lineWidth = 2;
  };

  /**
   * Draw notes and rests based on pattern
   */
  const drawNotesAndRests = (ctx, pattern, startX, centerY, noteSpacing, currentBeat, isPlaying) => {
    const noteStartX = startX + 50; // Start after time signature

    pattern.forEach((beat, index) => {
      const x = noteStartX + index * noteSpacing;
      const isCurrentBeat = isPlaying && index === currentBeat;

      if (beat === 1) {
        // Draw quarter note
        drawQuarterNote(ctx, x, centerY, isCurrentBeat);
      } else {
        // Draw quarter rest
        drawQuarterRest(ctx, x, centerY, isCurrentBeat);
      }
    });
  };

  /**
   * Draw a quarter note
   */
  const drawQuarterNote = (ctx, x, centerY, isHighlighted = false) => {
    ctx.fillStyle = isHighlighted ? "#fbbf24" : "#ffffff"; // Yellow when highlighted
    
    // Note head (filled oval on second line from bottom)
    const noteY = centerY + 20; // Second line from bottom
    ctx.beginPath();
    ctx.ellipse(x, noteY, 8, 6, Math.PI * 0.1, 0, 2 * Math.PI);
    ctx.fill();

    // Stem (going up)
    ctx.strokeStyle = isHighlighted ? "#fbbf24" : "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 7, noteY);
    ctx.lineTo(x + 7, noteY - 50);
    ctx.stroke();
  };

  /**
   * Draw a quarter rest
   */
  const drawQuarterRest = (ctx, x, centerY, isHighlighted = false) => {
    ctx.fillStyle = isHighlighted ? "#fbbf24" : "#ffffff80"; // Semi-transparent when highlighted
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    
    // Quarter rest symbol (𝄽)
    ctx.fillText("𝄽", x, centerY);
  };

  return (
    <Card className={`bg-white/10 backdrop-blur-md border-white/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white text-center text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="border border-white/20 rounded-lg bg-black/20"
            style={{ maxWidth: "100%" }}
          />
        </div>
        {pattern.length > 0 && (
          <div className="text-xs text-gray-300 text-center mt-2">
            {timeSignature.name} • {pattern.filter(beat => beat === 1).length} notes
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Simple inline notation display without card wrapper
 */
export function InlineNotationDisplay({
  pattern = [],
  timeSignature = { name: "4/4", beats: 4 },
  currentBeat = -1,
  isPlaying = false,
  width = 400,
  height = 100,
  className = "",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !pattern.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;

    // Simplified notation for inline display
    drawSimpleNotation(ctx, pattern, currentBeat, isPlaying, width, height);
  }, [pattern, currentBeat, isPlaying, width, height]);

  const drawSimpleNotation = (ctx, pattern, currentBeat, isPlaying, w, h) => {
    const margin = 20;
    const noteSpacing = (w - 2 * margin) / pattern.length;
    const centerY = h / 2;

    // Draw single staff line
    ctx.beginPath();
    ctx.moveTo(margin, centerY);
    ctx.lineTo(w - margin, centerY);
    ctx.stroke();

    // Draw simplified notes
    pattern.forEach((beat, index) => {
      const x = margin + index * noteSpacing;
      const isCurrentBeat = isPlaying && index === currentBeat;

      ctx.fillStyle = isCurrentBeat ? "#fbbf24" : "#ffffff";
      
      if (beat === 1) {
        // Simple filled circle for notes
        ctx.beginPath();
        ctx.arc(x, centerY, 4, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        // Simple dot for rests
        ctx.fillStyle = isCurrentBeat ? "#fbbf24" : "#ffffff80";
        ctx.beginPath();
        ctx.arc(x, centerY, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  return (
    <div className={`flex justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-white/20 rounded bg-black/20"
        style={{ maxWidth: "100%" }}
      />
    </div>
  );
}

export default RhythmNotationRenderer;
