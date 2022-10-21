import { createReaderView, EncAscii, EncUtf16be, EncUtf16le, EncUtf8, getBytes, getString, getUint, moveRel, peek, ReaderView } from "./reader";
import { CommonKeys, mapTag } from "./tagmap";
import { trimNull, splitTwo } from "./utils";

const getUint28 = (view: ReaderView): number => {
  return getBytes(view, 4).reduce((prev, curr) => (prev << 7) | (curr & 0x7f), 0);
};

const getEncodingText = (view: ReaderView, size: number) => {
  return getString(
    view,
    size - 1,
    {
      // ISO-8859-1
      0: EncAscii,

      // UTF-16 BOM
      1: peek(getUint)(view, 2) === 0xfeff ? EncUtf16be : EncUtf16le,

      // UTF-16BE w/o BOM
      2: EncUtf16be,
    }[getUint(view, 1)] ??
      // UTF-8 - null terminated
      EncUtf8
  );
};

const IdMap: Record<string, CommonKeys> = {
  TT1: "title",
  TT2: "title",
  TIT1: "title",
  TIT2: "title",
  TAL: "album",
  TALB: "album",
  TP1: "artist",
  TPE1: "artist",
  TP2: "albumartist",
  TPE2: "albumartist",
  TCM: "composer",
  TCOM: "composer",
  TRK: "track",
  TRCK: "track",
  TPS: "disc",
  TPOS: "disc",
  TYE: "year",
  TYER: "year",
  TDRC: "year",
  TSS: "encoder",
  TSSE: "encoder",
  TCO: "genre",
  TCON: "genre",
  COM: "comment",
  COMM: "comment",
};

type ID3v2Frame = {
  id: string;
  content?: string;
};

const readFrame = (view: ReaderView): ID3v2Frame | undefined => {
  try {
    const id = getString(view, 4, EncAscii);
    const size = getUint28(view);
    //+2 more for flags we don't care about
    moveRel(view, 2);

    const content = id[0] === "T" ? trimNull(getEncodingText(view, size)) : (moveRel(view, size), undefined);
    //id3v2.4 is supposed to have encoding terminations, but sometimes
    //they don't? meh.

    return { id, content };
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
  const view = createReaderView(buffer);
  if (getString(view, 3, EncAscii) !== "ID3") {
    return undefined;
  }

  // const majorVersion = getUint(view, 1);
  // const revisionVersion = getUint(view, 1);
  const flags = (moveRel(view, 2), getUint(view, 1)),
    size = getUint28(view),
    extendedHeader = !!(flags & 128),
    frames: Record<string, string> = {},
    extendedHeaderLength = extendedHeader ? getUint28(view) : 0;
  moveRel(view, extendedHeaderLength);

  for (; view[1] < 10 + extendedHeaderLength + size; ) {
    const frame = readFrame(view);
    if (!frame) {
      break;
    }

    if (!frame.content) {
      continue;
    }

    if (frame.id === "TXXX") {
      const [key, value] = splitTwo(frame.content, "\0");
      frames[key] = value;
    } else {
      mapTag(frames, IdMap, frame.id, frame.content);
    }
  }

  return frames;
};
