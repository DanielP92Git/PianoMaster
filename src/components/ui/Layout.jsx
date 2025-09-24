import React from "react";

// Container Component for responsive content width. this is a wrapper for the main content of the page.
const Container = React.forwardRef(
  (
    {
      children,
      size = "default",
      center = true,
      padding = "default",
      className = "",
      ...props
    },
    ref
  ) => {
    const sizes = {
      xs: "max-w-xs", // 320px
      sm: "max-w-sm", // 384px
      md: "max-w-md", // 448px
      lg: "max-w-lg", // 512px
      xl: "max-w-xl", // 576px
      "2xl": "max-w-2xl", // 672px
      "3xl": "max-w-3xl", // 768px
      "4xl": "max-w-4xl", // 896px
      "5xl": "max-w-5xl", // 1024px
      "6xl": "max-w-6xl", // 1152px
      "7xl": "max-w-7xl", // 1280px
      default: "max-w-4xl", // Default container size
      full: "max-w-full", // Full width
      screen: "max-w-screen-2xl", // Screen-based max width
    };

    const paddings = {
      none: "",
      small: "px-4 py-3",
      default: "px-4 py-6 sm:px-6 lg:px-8",
      large: "px-6 py-8 sm:px-8 lg:px-12",
      xl: "px-8 py-12 sm:px-12 lg:px-16",
    };

    return (
      <div
        ref={ref}
        className={`
        ${sizes[size]}
        ${center ? "mx-auto" : ""}
        ${paddings[padding]}
        ${className}
      `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";

// Grid Component for responsive layouts
const Grid = React.forwardRef(
  (
    { children, cols = 1, gap = 4, responsive = {}, className = "", ...props },
    ref
  ) => {
    // Handle responsive columns
    const getColumnClasses = () => {
      let classes = `grid-cols-${cols}`;

      // Add responsive classes
      Object.entries(responsive).forEach(([breakpoint, colCount]) => {
        classes += ` ${breakpoint}:grid-cols-${colCount}`;
      });

      return classes;
    };

    const gapClass = `gap-${gap}`;

    return (
      <div
        ref={ref}
        className={`
        grid ${getColumnClasses()} ${gapClass}
        ${className}
      `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = "Grid";

// Grid Item Component
const GridItem = React.forwardRef(
  (
    {
      children,
      colSpan = 1,
      rowSpan = 1,
      colStart,
      colEnd,
      rowStart,
      rowEnd,
      responsive = {},
      className = "",
      ...props
    },
    ref
  ) => {
    let classes = "";

    // Column span
    if (colSpan !== 1) {
      classes += ` col-span-${colSpan}`;
    }

    // Row span
    if (rowSpan !== 1) {
      classes += ` row-span-${rowSpan}`;
    }

    // Column start/end
    if (colStart) {
      classes += ` col-start-${colStart}`;
    }
    if (colEnd) {
      classes += ` col-end-${colEnd}`;
    }

    // Row start/end
    if (rowStart) {
      classes += ` row-start-${rowStart}`;
    }
    if (rowEnd) {
      classes += ` row-end-${rowEnd}`;
    }

    // Responsive classes
    Object.entries(responsive).forEach(([breakpoint, props]) => {
      if (props.colSpan) {
        classes += ` ${breakpoint}:col-span-${props.colSpan}`;
      }
      if (props.rowSpan) {
        classes += ` ${breakpoint}:row-span-${props.rowSpan}`;
      }
      if (props.colStart) {
        classes += ` ${breakpoint}:col-start-${props.colStart}`;
      }
      if (props.colEnd) {
        classes += ` ${breakpoint}:col-end-${props.colEnd}`;
      }
    });

    return (
      <div ref={ref} className={`${classes} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

GridItem.displayName = "GridItem";

// Flex Component for flexbox layouts
const Flex = React.forwardRef(
  (
    {
      children,
      direction = "row",
      wrap = false,
      justify = "start",
      align = "stretch",
      gap = 0,
      responsive = {},
      className = "",
      ...props
    },
    ref
  ) => {
    const directions = {
      row: "flex-row",
      "row-reverse": "flex-row-reverse",
      col: "flex-col",
      "col-reverse": "flex-col-reverse",
    };

    const justifications = {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    };

    const alignments = {
      start: "items-start",
      end: "items-end",
      center: "items-center",
      baseline: "items-baseline",
      stretch: "items-stretch",
    };

    let classes = `flex ${directions[direction]} ${justifications[justify]} ${alignments[align]}`;

    if (wrap) {
      classes += " flex-wrap";
    }

    if (gap > 0) {
      classes += ` gap-${gap}`;
    }

    // Add responsive classes
    Object.entries(responsive).forEach(([breakpoint, props]) => {
      if (props.direction) {
        classes += ` ${breakpoint}:${directions[props.direction]}`;
      }
      if (props.justify) {
        classes += ` ${breakpoint}:${justifications[props.justify]}`;
      }
      if (props.align) {
        classes += ` ${breakpoint}:${alignments[props.align]}`;
      }
      if (props.gap !== undefined) {
        classes += ` ${breakpoint}:gap-${props.gap}`;
      }
    });

    return (
      <div ref={ref} className={`${classes} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Flex.displayName = "Flex";

// Stack Component for vertical layouts with spacing
const Stack = React.forwardRef(
  (
    {
      children,
      spacing = 4,
      align = "stretch",
      responsive = {},
      className = "",
      ...props
    },
    ref
  ) => {
    const alignments = {
      start: "items-start",
      end: "items-end",
      center: "items-center",
      stretch: "items-stretch",
    };

    let classes = `flex flex-col ${alignments[align]} space-y-${spacing}`;

    // Add responsive spacing
    Object.entries(responsive).forEach(([breakpoint, props]) => {
      if (props.spacing !== undefined) {
        classes += ` ${breakpoint}:space-y-${props.spacing}`;
      }
      if (props.align) {
        classes += ` ${breakpoint}:${alignments[props.align]}`;
      }
    });

    return (
      <div ref={ref} className={`${classes} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Stack.displayName = "Stack";

// Center Component for centering content
const Center = React.forwardRef(
  ({ children, inline = false, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
        ${inline ? "inline-flex" : "flex"} 
        items-center justify-center
        ${className}
      `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Center.displayName = "Center";

// Spacer Component for adding space between elements
const Spacer = React.forwardRef(
  (
    {
      size = 4,
      direction = "vertical",
      responsive = {},
      className = "",
      ...props
    },
    ref
  ) => {
    let classes = "";

    if (direction === "vertical") {
      classes = `h-${size}`;
    } else {
      classes = `w-${size}`;
    }

    // Add responsive sizes
    Object.entries(responsive).forEach(([breakpoint, respSize]) => {
      if (direction === "vertical") {
        classes += ` ${breakpoint}:h-${respSize}`;
      } else {
        classes += ` ${breakpoint}:w-${respSize}`;
      }
    });

    return <div ref={ref} className={`${classes} ${className}`} {...props} />;
  }
);

Spacer.displayName = "Spacer";

// Responsive utility component
const Show = ({ above, below, only, children }) => {
  let classes = "";

  if (above) {
    classes += `hidden ${above}:block `;
  }

  if (below) {
    // This is more complex and might need custom CSS
    classes += "block ";
  }

  if (only) {
    const breakpoints = Array.isArray(only) ? only : [only];
    breakpoints.forEach((bp) => {
      classes += `${bp}:block `;
    });
    classes = `hidden ${classes}`;
  }

  return <div className={classes}>{children}</div>;
};

// Hide component (opposite of Show)
const Hide = ({ above, below, only, children }) => {
  let classes = "block ";

  if (above) {
    classes += `${above}:hidden `;
  }

  if (only) {
    const breakpoints = Array.isArray(only) ? only : [only];
    breakpoints.forEach((bp) => {
      classes += `${bp}:hidden `;
    });
  }

  return <div className={classes}>{children}</div>;
};

// Game Layout Component - specialized for game screens
const GameLayout = React.forwardRef(
  (
    {
      children,
      header,
      sidebar,
      footer,
      fullscreen = false,
      className = "",
      ...props
    },
    ref
  ) => {
    if (fullscreen) {
      return (
        <div
          ref={ref}
          className={`min-h-screen flex flex-col ${className}`}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`min-h-screen grid grid-rows-[auto_1fr_auto] ${className}`}
        {...props}
      >
        {header && <header className="sticky top-0 z-40">{header}</header>}

        <div className="flex-1 flex">
          {sidebar && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              {sidebar}
            </aside>
          )}

          <main className="flex-1 overflow-auto">{children}</main>
        </div>

        {footer && <footer>{footer}</footer>}
      </div>
    );
  }
);

GameLayout.displayName = "GameLayout";

export {
  Container as default,
  Container,
  Grid,
  GridItem,
  Flex,
  Stack,
  Center,
  Spacer,
  Show,
  Hide,
  GameLayout,
};
