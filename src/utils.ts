function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

export function trimNull(s: string): string {
  return s.replace(/\0+$/, "");
}

export function createView(buffer: ArrayBufferLike): DataView {
  if (typeof Buffer !== "undefined" && buffer instanceof Buffer) {
    //convert nodejs buffers to ArrayBuffer
    buffer = toArrayBuffer(buffer);
  }

  if (!(buffer instanceof ArrayBuffer)) {
    throw new Error("Expected instance of Buffer or ArrayBuffer");
  }

  return new DataView(buffer);
}

export function readBytes(
  view: DataView,
  offset: number,
  length: number,
  target?: DataView
) {
  if (offset + length < 0) {
    return [];
  }

  const bytes = [];
  const max = Math.min(offset + length, view.byteLength);
  for (let i = offset; i < max; i++) {
    const value = view.getUint8(i);
    bytes.push(value);
    if (target) {
      target.setUint8(i - offset, value);
    }
  }

  return bytes;
}

export function readAscii(
  view: DataView,
  offset: number,
  length: number
): string {
  if (view.byteLength < offset + length) {
    return "";
  }
  let s = "";
  for (let i = 0; i < length; i++) {
    s += String.fromCharCode(view.getUint8(offset + i));
  }

  return s;
}

export function readUtf8(
  view: DataView,
  offset: number,
  length: number
): string {
  if (view.byteLength < offset + length) {
    return "";
  }

  const buffer = view.buffer.slice(offset, offset + length);

  //http://stackoverflow.com/a/17192845 - convert byte array to UTF8 string
  const encodedString = String.fromCharCode(...new Uint8Array(buffer));
  return decodeURIComponent(escape(encodedString));
}
