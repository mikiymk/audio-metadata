/**
 * http://id3.org/id3v2.3.0
 * http://id3.org/id3v2.4.0-structure
 * http://id3.org/id3v2.4.0-frames
 */

import { createReaderView, EncAscii, EncUtf16be, EncUtf16le, EncUtf8, getBytes, getString, getUint, moveRel, peek, ReaderView } from "./reader";
import { CommonKeys, mapTag } from "./tagmap";
import { trimNull, splitTwo } from "./utils";

/**
 * read 4-byte SyncSafe Integer from ReaderView
 * @param view ReaderView contains SyncSafe Integer
 * @returns read number
 */
const getUint28 = (view: ReaderView): number => {
  return getBytes(view, 4).reduce((prev, curr) => (prev << 7) | (curr & 0x7f), 0);
};

/**
 * read ID3v2 text frame data
 *
 * | size    | tag            |
 * | ------- | -------------- |
 * | 1 byte  | encode         |
 * | n bytes | encoded string |
 *
 * encode is
 *
 * - 0x00 = ISO-8859-1
 * - 0x01 = UTF-16 with Byte Order Mark
 * - 0x02 = UTF-16 Big Endian
 * - 0x03 = UTF-8
 *
 * @param view ReaderView contains encoding byte and encoded string
 * @param size reading size
 * @returns decoded string
 */
const getEncodingText = (view: ReaderView, size: number) => {
  return getString(
    view,
    size - 1,
    {
      0: EncAscii,
      1: peek(getUint, 1)(view, 2) === 0xfeff ? EncUtf16be : EncUtf16le,
      2: EncUtf16be,
    }[getUint(view, 1)] ?? EncUtf8
  );
};

/**
 * ID3v2 tag map to common tag
 *
 * ref: https://wiki.hydrogenaud.io/index.php?title=Tag_Mapping
 */
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

/**
 * read ID3v2 frame
 *
 * | size    | tag         |
 * | ------- | ----------- |
 * | 4 bytes | frame ID    |
 * | 4 bytes | frame size  |
 * | 2 bytes | frame flags |
 * | n bytes | frame data  |
 *
 * @param view ReaderView contains ID3v2 frame
 * @returns ID3v2 frame object on success, undefined on failure
 */
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

/**
 * Read the ID3v2 tag from the buffer if it can be read.
 * @param buffer Buffer object for music files containing ID3v2 tags
 * @returns ID3v2 object on success, undefined on failure
 */
export const id3v2 = (buffer: ArrayBufferView | ArrayBufferLike): Record<string, string> | undefined => {
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
