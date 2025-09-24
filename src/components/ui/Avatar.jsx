import React from "react";
import { User } from "lucide-react";

const Avatar = React.forwardRef(
  (
    {
      src,
      alt = "Avatar",
      fallback,
      size = "default",
      shape = "circle",
      variant = "default",
      status,
      statusPosition = "bottom-right",
      highContrast = false,
      className = "",
      onClick,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(!!src);

    const handleImageLoad = () => {
      setIsLoading(false);
    };

    const handleImageError = () => {
      setImageError(true);
      setIsLoading(false);
    };

    const sizes = {
      xs: "w-6 h-6 text-xs",
      small: "w-8 h-8 text-sm",
      default: "w-12 h-12 text-base",
      large: "w-16 h-16 text-lg",
      xl: "w-20 h-20 text-xl",
      "2xl": "w-24 h-24 text-2xl",
    };

    const shapes = {
      circle: "rounded-full",
      square: "rounded-kids",
      rounded: "rounded-kids-lg",
    };

    const variants = {
      default: highContrast
        ? "bg-highContrast-bg border-2 border-highContrast-text text-highContrast-text"
        : "bg-gradient-to-br from-kidsPrimary-100 to-kidsPrimary-200 text-kidsPrimary-700",

      primary: highContrast
        ? "bg-highContrast-primary text-highContrast-bg border-2 border-highContrast-text"
        : "bg-gradient-to-br from-kidsPrimary-500 to-kidsPrimary-600 text-white",

      secondary: highContrast
        ? "bg-highContrast-secondary text-highContrast-bg border-2 border-highContrast-text"
        : "bg-gradient-to-br from-kidsSecondary-500 to-kidsSecondary-600 text-white",

      success: highContrast
        ? "bg-highContrast-success text-highContrast-bg border-2 border-highContrast-text"
        : "bg-gradient-to-br from-kidsSuccess-500 to-kidsSuccess-600 text-white",

      fun: "bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 text-white",
    };

    const statusColors = {
      online: highContrast ? "bg-highContrast-success" : "bg-kidsSuccess-500",
      offline: highContrast ? "bg-highContrast-text" : "bg-gray-400",
      busy: highContrast ? "bg-highContrast-error" : "bg-kidsError-500",
      away: highContrast ? "bg-highContrast-warning" : "bg-kidsWarning-500",
    };

    const statusPositions = {
      "top-right": "top-0 right-0",
      "top-left": "top-0 left-0",
      "bottom-right": "bottom-0 right-0",
      "bottom-left": "bottom-0 left-0",
    };

    const baseClasses = `
    relative inline-flex items-center justify-center font-semibold font-rounded
    overflow-hidden transition-all duration-300 flex-shrink-0
    ${onClick ? "cursor-pointer hover:scale-105" : ""}
  `;

    const showImage = src && !imageError && !isLoading;
    const showFallback = !showImage;

    return (
      <div
        ref={ref}
        className={`
        ${baseClasses}
        ${sizes[size]}
        ${shapes[shape]}
        ${variants[variant]}
        ${className}
      `}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={alt}
        {...props}
      >
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-1/2 w-1/2 border-2 border-white border-t-transparent" />
          </div>
        )}

        {/* Image */}
        {src && (
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover ${showImage ? "opacity-100" : "opacity-0"}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* Fallback content */}
        {showFallback && !isLoading && (
          <div className="flex items-center justify-center w-full h-full">
            {fallback ? (
              typeof fallback === "string" ? (
                <span className="uppercase font-bold">
                  {fallback.substring(0, 2)}
                </span>
              ) : (
                fallback
              )
            ) : (
              <User className="w-1/2 h-1/2" />
            )}
          </div>
        )}

        {/* Status indicator */}
        {status && (
          <div
            className={`
            absolute w-3 h-3 rounded-full border-2 border-white
            ${statusColors[status]}
            ${statusPositions[statusPosition]}
          `}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

// Avatar Group component for displaying multiple avatars
const AvatarGroup = React.forwardRef(
  (
    {
      children,
      max = 5,
      spacing = "-space-x-2",
      size = "default",
      showCount = true,
      className = "",
      ...props
    },
    ref
  ) => {
    const avatars = React.Children.toArray(children);
    const visibleAvatars = avatars.slice(0, max);
    const hiddenCount = avatars.length - max;

    return (
      <div
        ref={ref}
        className={`flex items-center ${spacing} ${className}`}
        {...props}
      >
        {visibleAvatars.map((avatar, index) => (
          <div key={index} className="relative z-10 ring-2 ring-white">
            {React.cloneElement(avatar, {
              size,
              className: `${avatar.props.className || ""} border-2 border-white`,
            })}
          </div>
        ))}

        {hiddenCount > 0 && showCount && (
          <Avatar
            size={size}
            fallback={`+${hiddenCount}`}
            variant="default"
            className="border-2 border-white bg-gray-200 text-gray-600 z-0"
          />
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = "AvatarGroup";

// Animated Avatar component with special effects
const AnimatedAvatar = React.forwardRef(
  ({ animation = "bounce", duration = "duration-1000", ...props }, ref) => {
    const animations = {
      bounce: "animate-bounce",
      pulse: "animate-pulse",
      wiggle: "animate-wiggle",
      float: "animate-float",
    };

    return (
      <Avatar
        ref={ref}
        className={`${animations[animation]} ${duration} ${props.className || ""}`}
        {...props}
      />
    );
  }
);

AnimatedAvatar.displayName = "AnimatedAvatar";

// Character Avatar component for piano app personas
const CharacterAvatar = React.forwardRef(
  (
    {
      character = "student",
      name,
      level,
      experience,
      className = "",
      ...props
    },
    ref
  ) => {
    const characters = {
      student: {
        emoji: "🎹",
        colors: "from-kidsPrimary-400 to-kidsPrimary-600",
      },
      teacher: {
        emoji: "🎼",
        colors: "from-kidsSecondary-400 to-kidsSecondary-600",
      },
      musician: {
        emoji: "🎵",
        colors: "from-kidsSuccess-400 to-kidsSuccess-600",
      },
      composer: {
        emoji: "🎶",
        colors: "from-purple-400 to-purple-600",
      },
    };

    const characterData = characters[character] || characters.student;

    return (
      <div className="text-center">
        <Avatar
          ref={ref}
          fallback={
            <span className="text-2xl" role="img" aria-label={character}>
              {characterData.emoji}
            </span>
          }
          className={`bg-gradient-to-br ${characterData.colors} ${className}`}
          {...props}
        />

        {name && (
          <div className="mt-2">
            <p className="text-sm font-semibold font-rounded text-white">
              {name}
            </p>
            {level && (
              <p className="text-xs font-rounded text-white/80">
                Level {level}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

CharacterAvatar.displayName = "CharacterAvatar";

export {
  Avatar as default,
  Avatar,
  AvatarGroup,
  AnimatedAvatar,
  CharacterAvatar,
};
