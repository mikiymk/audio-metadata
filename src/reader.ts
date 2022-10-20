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

  switch (length) {
    case 1:
      return view.getUint8(position);

    case 2:
      return view.getUint16(position, littleEndian);

    case 4:
      return view.getUint32(position, littleEndian);

    case 8:
      return Number(view.getBigUint64(position, littleEndian));

    default:
      throw new RangeError("length is limited to 1, 2, 4 or 8");
  }
};

export const getInt = (reader: ReaderView, length: 1 | 2 | 4 | 8, littleEndian = false): number => {
  const { view, position } = moveRel(reader, length);

  switch (length) {
    case 1:
      return view.getInt8(position);

    case 2:
      return view.getInt16(position, littleEndian);

    case 4:
      return view.getInt32(position, littleEndian);

    case 8:
      return Number(view.getBigInt64(position, littleEndian));

    default:
      throw new RangeError("length is limited to 1, 2, 4 or 8");
  }
};

export const EncAscii = "ascii";
export const EncUtf8 = "utf-8";
export const EncUtf16be = "utf-16be";
export const EncUtf16le = "utf-16le";

export const getString = (reader: ReaderView, length: number, encoding = EncUtf8): string => {
  const { view, position } = moveRel(reader, length);

  return new TextDecoder(encoding).decode(view.buffer.slice(position, position + length));
};

export const getBytes = (reader: ReaderView, length: number): Uint8Array => {
  const { view, position } = moveRel(reader, length);

  return new Uint8Array(view.buffer.slice(position, position + length));
};

export const peek =
  <Getter extends (reader: ReaderView, ...rest: never[]) => unknown>(getter: Getter, moveLength = 0) =>
  (...params: Parameters<Getter>): ReturnType<Getter> => {
    const [{ view, position }, ...rest] = params;
    const value = getter({ view, position: position + moveLength }, ...(rest as never[]));

    return value as ReturnType<Getter>;
  };
