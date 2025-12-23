import { useState, useRef, useEffect, useCallback } from "react";
import { getAvatarImageSource } from "../../utils/avatarAssets";

/**
 * AnimatedAvatar component that supports image-to-video-to-image transitions
 * Supports multiple composer animations with global control
 */
export const ACCESSORY_SLOT_STYLES = {
  hat: {
    className: "absolute -top-4 left-1/2 w-5/6 h-auto z-10",
    baseTransform: "translateX(-50%)",
  },
  headgear: {
    className: "absolute -top-2 left-1/2 w-5/6 h-auto",
    baseTransform: "translateX(-50%)",
    scale: 1.2,
  },
  eyes: {
    className: "absolute top-1 left-1/2 w-2/3 h-auto",
    baseTransform: "translateX(-40%)",
  },
  face: {
    className: "absolute inset-x-0 top-1/4 w-full h-auto",
    baseTransform: "",
  },
  body: {
    className: "absolute inset-0 w-full h-full",
    baseTransform: "",
  },
  background: {
    className: "absolute inset-0 w-full h-full opacity-80",
    baseTransform: "",
  },
  accessory: {
    className: "absolute inset-0 w-full h-full",
    baseTransform: "",
  },
};

function AnimatedAvatar({
  avatar,
  isSelected,
  onClick,
  animationVideoUrl = null,
  className = "",
  onAnimationStart = null,
  onAnimationEnd = null,
  shouldStopAnimation = false,
  accessories = [],
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const imageSrc = getAvatarImageSource(avatar);
  const layeredAccessories = Array.isArray(accessories)
    ? accessories.filter(
        (item) => item && (item.image_url || item?.accessory?.image_url)
      )
    : [];

  // Reset animation state when avatar changes
  useEffect(() => {
    setIsAnimating(false);
    setShowVideo(false);
    setIsLoading(false);
  }, [avatar.id]);

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

  const handleVideoEnd = useCallback(() => {
    setShowVideo(false);
    setIsAnimating(false);
    setIsLoading(false);

    // Notify parent that animation has ended
    if (onAnimationEnd) {
      onAnimationEnd(avatar.id);
    }
  }, [avatar.id, onAnimationEnd]);

  // Handle external stop animation signal
  useEffect(() => {
    if (shouldStopAnimation && isAnimating) {
      handleVideoEnd();
    }
  }, [shouldStopAnimation, isAnimating, handleVideoEnd]);

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
      className={`group relative aspect-square overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        isSelected
          ? "scale-110 shadow-2xl shadow-indigo-500/50 ring-4 ring-indigo-500"
          : "ring-1 ring-gray-200"
      } ${isAnimating ? "cursor-wait" : "cursor-pointer"} ${className} `}
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
      {imageSrc && (
        <img
          src={imageSrc}
          alt={`Avatar ${avatar.id}`}
          className={`h-full w-full object-cover transition-opacity duration-300 ${showVideo ? "opacity-0" : "opacity-100"} `}
        />
      )}

      {/* Animation Video */}
      {animationVideoUrl && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${showVideo ? "opacity-100" : "pointer-events-none opacity-0"} `}
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

      {/* Accessory overlays */}
      {layeredAccessories.map((item) => {
        const metadata = item.metadata || item.accessory?.metadata || {};
        const {
          offsetX = 0,
          offsetY = 0,
          scale = 1,
          rotation = 0,
          flip = false,
        } = metadata;

        const imageUrl = item.image_url || item.accessory?.image_url;
        if (!imageUrl) return null;

        const slot =
          item.slot || item.category || item.accessory?.category || "accessory";

        const slotStyle =
          ACCESSORY_SLOT_STYLES[slot] || ACCESSORY_SLOT_STYLES.accessory;
        const slotClass = slotStyle.className;
        const baseTransform = slotStyle.baseTransform || "";

        const scaleX = flip ? -scale : scale;
        const transforms = [
          baseTransform,
          `translate(${offsetX}px, ${offsetY}px)`,
          `scale(${scaleX}, ${scale})`,
          `rotate(${rotation}deg)`,
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <img
            key={`${item.accessory_id || item.id}-${slot}`}
            src={imageUrl}
            alt={`${slot} accessory`}
            className={`${slotClass} pointer-events-none object-contain transition-opacity duration-300 ${
              showVideo ? "opacity-0" : "opacity-100"
            }`}
            style={{ transform: transforms }}
          />
        );
      })}

      {/* Hover Overlay - only show when not animating */}
      {!isAnimating && (
        <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity group-hover:bg-opacity-20" />
      )}

      {/* Loading Indicator - only show while loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}
    </button>
  );
}

export default AnimatedAvatar;
