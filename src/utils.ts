function toArrayBuffer(buffer: string | any[] | Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

module.exports = {
  trimNull: function (s: string) {
    return s.replace(/\0+$/, "");
  },

  createView: function (buffer: ArrayBufferLike) {
    if (typeof Buffer !== "undefined" && buffer instanceof Buffer) {
      //convert nodejs buffers to ArrayBuffer
      buffer = toArrayBuffer(buffer);
    }

    if (!(buffer instanceof ArrayBuffer)) {
      throw new Error("Expected instance of Buffer or ArrayBuffer");
    }

    return new DataView(buffer);
  },

  readBytes: function (
    view: { byteLength: number; getUint8: (arg0: any) => any },
    offset: number,
    length: any,
    target: { setUint8: (arg0: number, arg1: any) => void }
  ) {
    if (offset + length < 0) {
      return [];
    }

    var bytes = [];
    var max = Math.min(offset + length, view.byteLength);
    for (var i = offset; i < max; i++) {
      var value = view.getUint8(i);
      bytes.push(value);
      if (target) {
        target.setUint8(i - offset, value);
      }
    }

    return bytes;
  },

  readAscii: function (
    view: { byteLength: number; getUint8: (arg0: any) => number },
    offset: number,
    length: number
  ) {
    if (view.byteLength < offset + length) {
      return "";
    }
    var s = "";
    for (var i = 0; i < length; i++) {
      s += String.fromCharCode(view.getUint8(offset + i));
    }

    return s;
  },

  readUtf8: function (
    view: { byteLength: number; buffer: string | any[] },
    offset: any,
    length: any
  ) {
    if (view.byteLength < offset + length) {
      return "";
    }

    var buffer = view.buffer.slice(offset, offset + length);

    //http://stackoverflow.com/a/17192845 - convert byte array to UTF8 string
    const encodedString = String.fromCharCode.apply(
      null,
      new Uint8Array(buffer)
    );
    return decodeURIComponent(escape(encodedString));
  },
};
