export const trimNull = (s: string): string => {
  return s.replace(/\0+$/, "");
};

export const splitTwo = (s: string, separator: string): [string, string] => {
  const index = s.indexOf(separator);
  return [s.substring(0, index), s.substring(index + 1)];
};
