import { readBytes, createView, readAscii, readUtf8, trimNull, readUtf16, readUtf16be } from "./utils";

const checkMagicId3 = (view: DataView, offset: number): boolean => {
  const id3Magic = readAscii(view, offset, 3);
  //"ID3"
  return id3Magic === "ID3";
};

const getUint28 = (view: DataView, offset: number): number => {
  const sizeBytes = readBytes(view, offset, 4);
  const mask = 0x0fff_ffff;
  return ((sizeBytes[0] & mask) << 21) | ((sizeBytes[1] & mask) << 14) | ((sizeBytes[2] & mask) << 7) | (sizeBytes[3] & mask);
};

const getEncodingText = (view: DataView, offset: number, size: number) => {
  switch (view.getUint8(offset - 1)) {
    case 0:
      // ISO-8859-1
      return readAscii(view, offset, size - 1);

    case 1:
      // UTF-16 BOM
      return readUtf16(view, offset, size - 1);

    case 2:
      // UTF-16BE w/o BOM
      return readUtf16be(view, offset, size - 1);

    case 3:
      //UTF8 - null terminated
      return readUtf8(view, offset, size - 1);

    default:
      // no-encoding
      return readAscii(view, offset - 1, size);
  }
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
    offset += 10; //+2 more for flags we don't care about

    if (id[0] !== "T") {
      return { id, size };
    }

    const data = getEncodingText(view, offset + 1, size - 10);
    //id3v2.4 is supposed to have encoding terminations, but sometimes
    //they don't? meh.

    return { id, size, content: trimNull(data) };
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
  if (!checkMagicId3(view, 0)) {
    return undefined;
  }

  //var majorVersion = view.getUint8(3);
  const flags = view.getUint8(5),
    size = getUint28(view, 6),
    extendedHeader = (flags & 128) !== 0;

  let extendedHeaderLength = 0;
  if (extendedHeader) {
    extendedHeaderLength = getUint28(view, 10);
  }

  const idMap: Record<string, string> = {
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

  const endOfTags = 10 + extendedHeaderLength + size,
    frames: Record<string, string> = {};
  let offset = 10 + extendedHeaderLength;
  while (offset < endOfTags) {
    const frame = readFrame(view, offset);
    if (!frame) {
      break;
    }

    offset += frame.size;
    if (!frame.content) {
      continue;
    }

    const id = idMap[frame.id] || frame.id;
    if (id === "TXXX") {
      const nullByte = frame.content.indexOf("\0");
      frames[frame.content.substring(0, nullByte)] = frame.content.substring(nullByte + 1);
    } else {
      frames[id] = frames[frame.id] = frame.content;
    }
  }

  return frames;
};
