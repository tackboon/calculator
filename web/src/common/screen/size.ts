import { useState, useEffect } from "react";

export const useCheckIsSmallView = () => {
  // State to track whether the view is small view
  const [isSmallView, setIsSmallView] = useState(window.innerWidth <= 600);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth <= 600 && !isSmallView) {
        setIsSmallView(true);
      } else if (window.innerWidth > 600 && isSmallView) {
        setIsSmallView(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isSmallView]);

  return isSmallView;
};

export const useGetViewSize = () => {
  // State to track the view size
  const [viewSize, setViewSize] = useState(window.innerWidth);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      setViewSize(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return viewSize;
};
