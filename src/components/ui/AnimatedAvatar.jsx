import React, { useState, useRef, useEffect } from "react";

/**
 * AnimatedAvatar component that supports image-to-video-to-image transitions
 * Supports multiple composer animations with global control
 */
function AnimatedAvatar({
  avatar,
  isSelected,
  onClick,
  animationVideoUrl = null,
  className = "",
  onAnimationStart = null,
  onAnimationEnd = null,
  shouldStopAnimation = false,
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);

  // Reset animation state when avatar changes
  useEffect(() => {
    setIsAnimating(false);
    setShowVideo(false);
    setIsLoading(false);
  }, [avatar.id]);

  // Handle external stop animation signal
  useEffect(() => {
    if (shouldStopAnimation && isAnimating) {
      handleVideoEnd();
    }
  }, [shouldStopAnimation, isAnimating]);

  const handleClick = () => {
    // If this avatar has an animation video, play it
    if (animationVideoUrl && !isAnimating) {
      // Notify parent that this animation is starting (to stop others)
      if (onAnimationStart) {
        onAnimationStart(avatar.id);
      }
      playAnimation();
    }

    // Always call the onClick handler
    onClick(avatar);
  };

  const playAnimation = () => {
    setIsAnimating(true);
    setIsLoading(true);
    setShowVideo(true);

    // Wait a brief moment for video element to be ready
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0; // Reset to beginning
        videoRef.current.play().catch((error) => {
          console.error("Error playing avatar animation:", error);
          // Fallback to image if video fails
          handleVideoEnd();
        });
      }
    }, 50);
  };

  const handleVideoEnd = () => {
    setShowVideo(false);
    setIsAnimating(false);
    setIsLoading(false);

    // Notify parent that animation has ended
    if (onAnimationEnd) {
      onAnimationEnd(avatar.id);
    }
  };

  const handleVideoError = (error) => {
    console.error("Avatar animation video error:", error);
    handleVideoEnd();
  };

  const handleVideoCanPlay = () => {
    // Video is ready to play, hide loading spinner
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isAnimating}
      className={`
        relative group aspect-square rounded-xl overflow-hidden 
        transition-all duration-300 hover:scale-105 focus:outline-none 
        focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
        ${
          isSelected
            ? "ring-4 ring-indigo-500 scale-110 shadow-2xl shadow-indigo-500/50"
            : "ring-1 ring-gray-200"
        }
        ${isAnimating ? "cursor-wait" : "cursor-pointer"}
        ${className}
      `}
      style={
        isSelected
          ? {
              boxShadow:
                "0 0 30px rgba(99, 102, 241, 0.6), 0 0 60px rgba(99, 102, 241, 0.3)",
            }
          : undefined
      }
    >
      {/* Static Avatar Image */}
      <img
        src={avatar.image_url}
        alt={`Avatar ${avatar.id}`}
        className={`
          w-full h-full object-cover transition-opacity duration-300
          ${showVideo ? "opacity-0" : "opacity-100"}
        `}
      />

      {/* Animation Video */}
      {animationVideoUrl && (
        <video
          ref={videoRef}
          className={`
            absolute inset-0 w-full h-full object-cover transition-opacity duration-300
            ${showVideo ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
          muted
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoError}
          onCanPlay={handleVideoCanPlay}
          preload="metadata"
        >
          <source src={animationVideoUrl} type="video/mp4" />
        </video>
      )}

      {/* Hover Overlay - only show when not animating */}
      {!isAnimating && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
      )}

      {/* Loading Indicator - only show while loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
}

export default AnimatedAvatar;
