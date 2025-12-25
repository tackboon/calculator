export type CustomGroupInputType = {
  numbers: string;
  count: string;
};

export enum ERROR_FIELD_CUSTOM_GROUP {
  NUMBERS,
  COUNT,
}

export type CustomGroupType = {
  name: string;
  idx: number;
  onInputChange: (inputData: CustomGroupInputType) => void;
  deleteHandler: () => void;
  errorField: ERROR_FIELD_CUSTOM_GROUP | null;
};
