import { FC, HTMLAttributes, useState } from "react";

import styles from "./image.module.scss";

type ImageWithSkeletonProps = {
  src: string;
  alt: string;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

const ImageWithSkeleton: FC<ImageWithSkeletonProps> = ({
  src,
  alt,
  className,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`${styles["image-container"]} ${className ? className : ""}`}
      {...props}
    >
      {!loaded && <div className={styles["image-skeleton"]} />}
      <img src={src} alt={alt} onLoad={() => setLoaded(true)} />
    </div>
  );
};

export default ImageWithSkeleton;
