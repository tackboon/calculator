import { FC, SVGAttributes } from "react";

type AddIconType = {
  size: number;
} & SVGAttributes<SVGElement>;

const AddIcon: FC<AddIconType> = ({ size, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={`${size}px`}
      viewBox="0 -960 960 960"
      width={`${size}px`}
      {...props}
    >
      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
    </svg>
  );
};

export default AddIcon;
