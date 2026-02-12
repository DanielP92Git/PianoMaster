import { useState, useRef, useEffect, useCallback, useMemo } from "react";

export function DraggableAccessory({
  item,
  slotClass,
  baseTransform,
  initialMetadata,
  onPositionChange,
  isEditMode = false,
}) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [committedOffset, setCommittedOffset] = useState({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const lastSavedPos = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);

  const metadata = useMemo(() => initialMetadata || {}, [initialMetadata]);
  const {
    offsetX = 0,
    offsetY = 0,
    scale = 1,
    rotation = 0,
    flip = false,
  } = metadata;

  const imageUrl = item.image_url || item.accessory?.image_url;

  // When metadata updates from server, clear the committed offset
  useEffect(() => {
    const currentSaved = { x: offsetX, y: offsetY };
    // If server position matches what we last saved, clear committed offset
    if (
      Math.round(currentSaved.x) === Math.round(lastSavedPos.current.x) &&
      Math.round(currentSaved.y) === Math.round(lastSavedPos.current.y)
    ) {
      setCommittedOffset({ x: 0, y: 0 });
    }
  }, [offsetX, offsetY]);

  // Current position = saved offset + committed offset + drag offset
  const currentX = offsetX + committedOffset.x + dragOffset.x;
  const currentY = offsetY + committedOffset.y + dragOffset.y;

  const handleMouseDown = useCallback(
    (e) => {
      if (!isEditMode) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
    },
    [isEditMode]
  );

  const finalizeDrag = useCallback(() => {
    setIsDragging(false);

    setCommittedOffset((prev) => ({
      x: prev.x + dragOffset.x,
      y: prev.y + dragOffset.y,
    }));

    // Reset temporary drag offset
    setDragOffset({ x: 0, y: 0 });

    // Save to server
    const newX = Math.round(currentX);
    const newY = Math.round(currentY);
    lastSavedPos.current = { x: newX, y: newY };

    if (onPositionChange) {
      onPositionChange({
        ...metadata,
        offsetX: newX,
        offsetY: newY,
      });
    }
  }, [dragOffset, currentX, currentY, metadata, onPositionChange]);

  // Handle mouse drag events globally to prevent losing drag when cursor leaves image
  useEffect(() => {
    if (!isEditMode || !isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      setDragOffset({ x: deltaX, y: deltaY });
    };

    const handleMouseUp = () => {
      finalizeDrag();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isEditMode, isDragging, finalizeDrag]);

  // Handle touch events with passive: false
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !isEditMode) return;

    const handleTouchStart = (e) => {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      e.preventDefault();
    };

    const handleTouchMove = (e) => {
      const deltaX = e.touches[0].clientX - dragStartPos.current.x;
      const deltaY = e.touches[0].clientY - dragStartPos.current.y;
      setDragOffset({ x: deltaX, y: deltaY });
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      finalizeDrag();
    };

    img.addEventListener("touchstart", handleTouchStart, { passive: false });
    img.addEventListener("touchmove", handleTouchMove, { passive: false });
    img.addEventListener("touchend", handleTouchEnd);

    return () => {
      img.removeEventListener("touchstart", handleTouchStart);
      img.removeEventListener("touchmove", handleTouchMove);
      img.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isEditMode, finalizeDrag]);

  const scaleX = flip ? -scale : scale;
  const transforms = [
    baseTransform,
    `translate(${currentX}px, ${currentY}px)`,
    `scale(${scaleX}, ${scale})`,
    `rotate(${rotation}deg)`,
  ]
    .filter(Boolean)
    .join(" ");

  if (!imageUrl) {
    return null;
  }

  return (
    <img
      ref={imgRef}
      src={imageUrl}
      alt={`${item.category || item.slot} accessory`}
      className={`${slotClass} object-contain transition-opacity duration-300 ${
        isEditMode ? "cursor-move" : "pointer-events-none"
      } ${isDragging ? "z-50" : ""}`}
      style={{
        transform: transforms,
        touchAction: isEditMode ? "none" : "auto",
      }}
      onMouseDown={handleMouseDown}
      draggable={false}
    />
  );
}
