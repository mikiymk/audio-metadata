export const trimNull = (s: string): string => {
  return s.replace(/\0+$/, "");
};

export const splitTwo = (s: string, separator: string): [string, string] => {
  const index = s.indexOf(separator);
  return [s.substring(0, index), s.substring(index + 1)];
};

export const createView = (buffer: Uint8Array | ArrayBufferLike): DataView => {
  if (buffer instanceof Uint8Array) {
    //convert nodejs buffers to ArrayBuffer
    buffer = buffer.buffer.slice(0);
  }

  if (!(buffer instanceof ArrayBuffer)) {
    throw new Error("Expected instance of Buffer or ArrayBuffer");
  }

  return new DataView(buffer);
};

export const readBytes = (view: DataView, offset: number, length: number): Uint8Array => {
  return new Uint8Array(view.buffer).slice(offset, offset + length);
};

export const readString =
  (encoding?: string) =>
  (view: DataView, offset: number, length: number): string => {
    return new TextDecoder(encoding).decode(view.buffer.slice(offset, offset + length));
  };

export const readAscii = readString("ascii");
export const readUtf8 = readString();
export const readUtf16be = readString("utf-16be");
export const readUtf16le = readString("utf-16le");
