import { useState, useEffect } from "react";

export const useCheckIsSmallView = () => {
  // State to track whether the view is small view
  const [isSmallView, setIsSmallView] = useState(window.innerWidth <= 767);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth <= 767 && !isSmallView) {
        setIsSmallView(true);
      } else if (window.innerWidth > 767 && isSmallView) {
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

export const useCheckIsLargeView = () => {
  // State to track whether the view is large view
  const [isLargeView, setIsLargeView] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth >= 1024 && !isLargeView) {
        setIsLargeView(true);
      } else if (window.innerWidth < 1024 && isLargeView) {
        setIsLargeView(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isLargeView]);

  return isLargeView;
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
