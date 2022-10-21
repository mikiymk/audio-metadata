export type ReaderView = [view: DataView, position: number];

export const createReaderView = (buffer: ArrayBufferView | ArrayBufferLike): ReaderView => {
  let view: DataView;
  if (ArrayBuffer.isView(buffer)) {
    view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else if (buffer instanceof ArrayBuffer || buffer instanceof SharedArrayBuffer) {
    view = new DataView(buffer);
  } else {
    throw new Error("Expected instance of TypedArray, DataView or ArrayBuffer");
  }

  return [view, 0];
};

const normalize: (reader: ReaderView) => void = (reader) => {
  const [view, position] = reader;
  reader[1] = position < 0 ? view.byteLength + position : position;
};

export const moveRel: (reader: ReaderView, length: number) => ReaderView = (reader, length) => {
  const [view, position] = reader;
  reader[1] += length;
  normalize(reader);

  return [view, position];
};

export const moveAbs: (reader: ReaderView, newPosition: number) => ReaderView = (reader, newPosition) => {
  const [view, position] = reader;
  reader[1] = newPosition;
  normalize(reader);

  return [view, position];
};

export const restLength: (reader: ReaderView) => number = ([view, position]) => {
  return view.byteLength - position;
};

export const getUint: (reader: ReaderView, length: 1 | 2 | 4 | 8, littleEndian?: boolean) => number = (reader, length, littleEndian = false) => {
  const [view, position] = moveRel(reader, length);

  return Number(
    view[
      (
        {
          1: "getUint8",
          2: "getUint16",
          4: "getUint32",
          8: "getBigUint64",
        } as const
      )[length]
    ](position, littleEndian)
  );
};

export const getInt: (reader: ReaderView, length: 1 | 2 | 4 | 8, littleEndian?: boolean) => number = (reader, length, littleEndian = false) => {
  const [view, position] = moveRel(reader, length);

  return Number(
    view[
      (
        {
          1: "getInt8",
          2: "getInt16",
          4: "getInt32",
          8: "getBigInt64",
        } as const
      )[length]
    ](position, littleEndian)
  );
};

const getArrayBuffer: (reader: ReaderView, length: number) => ArrayBufferLike = (reader, length) => {
  const [view, position] = moveRel(reader, length);

  return view.buffer.slice(position, position + length);
};

export const EncAscii = "ascii";
export const EncUtf8 = "utf-8";
export const EncUtf16be = "utf-16be";
export const EncUtf16le = "utf-16le";

export const getString: (reader: ReaderView, length: number, encoding?: string) => string = (reader, length, encoding = EncUtf8) => {
  return new TextDecoder(encoding).decode(getArrayBuffer(reader, length));
};

export const getBytes: (reader: ReaderView, length: number) => Uint8Array = (reader, length) => {
  return new Uint8Array(getArrayBuffer(reader, length));
};

export const getView: (reader: ReaderView, length: number) => ReaderView = (reader, length) => {
  return createReaderView(getArrayBuffer(reader, length));
};

export const peek: <Getter extends (reader: ReaderView, ...rest: never[]) => unknown>(
  getter: Getter,
  moveLength?: number
) => (...params: Parameters<Getter>) => ReturnType<Getter> =
  <Getter extends (reader: ReaderView, ...rest: never[]) => unknown>(getter: Getter, moveLength = 0) =>
  (...params) => {
    const [[view, position], ...rest] = params;
    const value = getter([view, position + moveLength], ...(rest as never[]));

    return value as ReturnType<Getter>;
  };
