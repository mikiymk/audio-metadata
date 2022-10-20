export interface ReaderView {
  view: DataView;
  position: number;
}

export const createReaderView = (buffer: ArrayBufferView | ArrayBufferLike): ReaderView => {
  let view: DataView;
  if (ArrayBuffer.isView(buffer)) {
    view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else if (buffer instanceof ArrayBuffer || buffer instanceof SharedArrayBuffer) {
    view = new DataView(buffer);
  } else {
    throw new Error("Expected instance of TypedArray, DataView or ArrayBuffer");
  }

  return {
    view,
    position: 0,
  };
};

export const moveRel = (reader: ReaderView, length: number): ReaderView => {
  const position = reader.position;
  const view = reader.view;
  reader.position += length;

  return { view, position };
};

export const moveAbs = (reader: ReaderView, newPosition: number): ReaderView => {
  const position = reader.position;
  const view = reader.view;
  reader.position = newPosition < 0 ? view.byteLength + newPosition : newPosition;

  return { view, position };
};

export const restLength = (reader: ReaderView): number => {
  return reader.view.byteLength - reader.position;
};

export const getUint = (reader: ReaderView, length: 1 | 2 | 4 | 8, littleEndian = false): number => {
  const { view, position } = moveRel(reader, length);
  return Number(
    {
      1: (position: number) => view.getUint8(position),
      2: (position: number, littleEndian: boolean) => view.getUint16(position, littleEndian),
      4: (position: number, littleEndian: boolean) => view.getUint32(position, littleEndian),
      8: (position: number, littleEndian: boolean) => view.getBigUint64(position, littleEndian),
    }[length](position, littleEndian)
  );
};

export const getInt = (reader: ReaderView, length: 1 | 2 | 4 | 8, littleEndian = false): number => {
  const { view, position } = moveRel(reader, length);

  return Number(
    {
      1: (position: number) => view.getInt8(position),
      2: (position: number, littleEndian: boolean) => view.getInt16(position, littleEndian),
      4: (position: number, littleEndian: boolean) => view.getInt32(position, littleEndian),
      8: (position: number, littleEndian: boolean) => view.getBigInt64(position, littleEndian),
    }[length](position, littleEndian)
  );
};

const getArrayBuffer = (reader: ReaderView, length: number): ArrayBufferLike => {
  const { view, position } = moveRel(reader, length);

  return view.buffer.slice(position, position + length);
};

export const EncAscii = "ascii";
export const EncUtf8 = "utf-8";
export const EncUtf16be = "utf-16be";
export const EncUtf16le = "utf-16le";

export const getString = (reader: ReaderView, length: number, encoding = EncUtf8): string => {
  return new TextDecoder(encoding).decode(getArrayBuffer(reader, length));
};

export const getBytes = (reader: ReaderView, length: number): Uint8Array => {
  return new Uint8Array(getArrayBuffer(reader, length));
};

export const getView = (reader: ReaderView, length: number): ReaderView => {
  return createReaderView(getArrayBuffer(reader, length));
};

export const peek =
  <Getter extends (reader: ReaderView, ...rest: never[]) => unknown>(getter: Getter, moveLength = 0) =>
  (...params: Parameters<Getter>): ReturnType<Getter> => {
    const [{ view, position }, ...rest] = params;
    const value = getter({ view, position: position + moveLength }, ...(rest as never[]));

    return value as ReturnType<Getter>;
  };
