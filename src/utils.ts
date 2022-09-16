const toArrayBuffer = (buffer: Uint8Array): ArrayBuffer => {
  return buffer.buffer.slice(0);
};

export const trimNull = (s: string): string => {
  return s.replace(/\0+$/, "");
};

export const createView = (buffer: Uint8Array | ArrayBufferLike): DataView => {
  if (buffer instanceof Uint8Array) {
    //convert nodejs buffers to ArrayBuffer
    buffer = toArrayBuffer(buffer);
  }

  if (!(buffer instanceof ArrayBuffer)) {
    throw new Error("Expected instance of Buffer or ArrayBuffer");
  }

  return new DataView(buffer);
};

export const readBytes = (view: DataView, offset: number, length: number, target?: DataView): number[] => {
  const u8 = (view: DataView) => new Uint8Array(view.buffer);
  const u8view = u8(view);

  if (target) {
    const u8target = u8(target);
    const max = Math.min(offset + length, u8view.byteLength);

    for (let i = offset; i < max; i++) {
      u8target[i - offset] = u8view[i];
    }
  }

  return [...u8view.slice(offset, offset + length)];
};

export const readAscii = (view: DataView, offset: number, length: number): string => {
  return new TextDecoder("ascii").decode(view.buffer.slice(offset, offset + length));
};

export const readUtf8 = (view: DataView, offset: number, length: number): string => {
  return new TextDecoder().decode(view.buffer.slice(offset, offset + length));
};

export const readUtf16 = (view: DataView, offset: number, length: number): string => {
  if (view.getUint16(offset) === 0xfeff) {
    return new TextDecoder("utf16be").decode(view.buffer.slice(offset, offset + length));
  } else {
    return new TextDecoder("utf16le").decode(view.buffer.slice(offset, offset + length));
  }
};

export const readUtf16be = (view: DataView, offset: number, length: number): string => {
  return new TextDecoder("utf16be").decode(view.buffer.slice(offset, offset + length));
};
