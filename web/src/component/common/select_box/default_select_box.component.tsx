import { FC, ChangeEvent, SelectHTMLAttributes } from "react";

type DefaultSelectProps = {
  name?: string;
  options: string[];
  defaultIndex: number;
  onChangeHandler: (idx: number) => void;
} & SelectHTMLAttributes<HTMLSelectElement>;

const DefaultSelect: FC<DefaultSelectProps> = ({
  name,
  className,
  options,
  defaultIndex,
  onChangeHandler,
  ...props
}) => {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newIndex = options.indexOf(e.target.value);
    onChangeHandler(newIndex);
  };

  return (
    <select
      name={name}
      className={className}
      value={options[defaultIndex]}
      onChange={handleChange}
      {...props}
    >
      {options.map((val) => (
        <option key={val} value={val}>
          {val}
        </option>
      ))}
    </select>
  );
};

export default DefaultSelect;
