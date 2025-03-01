import React, { useEffect } from "react";

function YourComponent() {
  useEffect(() => {
    // Check if the screen orientation API is supported
    if (screen.orientation && screen.orientation.lock) {
      // Lock the screen orientation to landscape
      screen.orientation.lock("landscape").catch((error) => {
        console.error("Error locking orientation: ", error);
      });
    }

    // Cleanup function to unlock orientation when the component unmounts
    return () => {
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, []);

  return <div>{/* Your component content */}</div>;
}

export default YourComponent;
