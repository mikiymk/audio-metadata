import { readBytes, createView, readAscii, readUtf8, trimNull, readUtf16be, splitTwo, readString } from "./utils";

const getUint28 = (view: DataView, offset: number): number => {
  return readBytes(view, offset, 4).reduce((prev, curr) => (prev << 7) | (curr & 0x0fff_ffff), 0);
};

const getEncodingText = (encoding: number) => {
  switch (encoding) {
    case 1:
      // UTF-16 BOM
      return (view: DataView, offset: number, length: number): string => {
        if (view.getUint16(offset) === 0xfeff) {
          return readUtf16be(view, offset, length);
        } else {
          return readString("utf16le")(view, offset, length);
        }
      };

    case 2:
      // UTF-16BE w/o BOM
      return readString("utf16be");

    case 3:
      //UTF8 - null terminated
      return readUtf8;

    case 0:
    // ISO-8859-1

    // fallthrough
    default:
      // no-encoding
      return readAscii;
  }
};

const IdMap: Record<string, string> = {
  TALB: "album",
  TCOM: "composer",
  TIT1: "title",
  TIT2: "title",
  TPE1: "artist",
  TRCK: "track",
  TSSE: "encoder",
  TDRC: "year",
  TCON: "genre",
};

type ID3v2Frame = {
  id: string;
  size: number;
  content?: string;
};

const readFrame = (view: DataView, offset: number): ID3v2Frame | undefined => {
  try {
    const id = readAscii(view, offset, 4);
    const size = 10 + getUint28(view, offset + 4);
    //+2 more for flags we don't care about

    const content = id[0] === "T" ? trimNull(getEncodingText(view.getUint8(offset + 9))(view, offset + 11, size - 11)) : undefined;
    //id3v2.4 is supposed to have encoding terminations, but sometimes
    //they don't? meh.

    return { id, size, content };
  } catch {
    return undefined;
  }
};

//http://id3.org/id3v2.3.0
//http://id3.org/id3v2.4.0-structure
//http://id3.org/id3v2.4.0-frames
/**
 * Read the ID3v2 tag from the buffer if it can be read.
 * @param buffer Buffer object for music files containing ID3v2 tags
 * @returns ID3v2 object on success, undefined on failure
 */
export const id3v2 = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createView(buffer);
  if (readAscii(view, 0, 3) !== "ID3") {
    return undefined;
  }

  //var majorVersion = view.getUint8(3);
  const flags = view.getUint8(5),
    size = getUint28(view, 6),
    extendedHeader = !!(flags & 128),
    frames: Record<string, string> = {},
    extendedHeaderLength = extendedHeader ? getUint28(view, 10) : 0;

  for (let offset = 10 + extendedHeaderLength; offset < 10 + extendedHeaderLength + size; ) {
    const frame = readFrame(view, offset);
    if (!frame) {
      break;
    }

    offset += frame.size;
    if (!frame.content) {
      continue;
    }

    const id = IdMap[frame.id] || frame.id;
    if (id === "TXXX") {
      const [key, value] = splitTwo(frame.content, "\0");
      frames[key] = value;
    } else {
      frames[id] = frames[frame.id] = frame.content;
    }
  }

  return frames;
};
