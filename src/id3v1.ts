import { createReaderView, EncAscii, getString, getUint, moveAbs, peek, ReaderView } from "./reader";
import { trimNull } from "./utils";

const checkMagicId3v1 = (view: ReaderView): boolean => {
  moveAbs(view, -128);
  //"TAG"
  return getString(view, 3, EncAscii) === "TAG";
};

export type ID3v1 = {
  title: string;
  artist: string;
  album: string;
  year: string;
  comment: string;
  track: number | undefined;
  genre: number;
};

/**
 * Read the ID3v1 tag from the last 128 bytes of the buffer if it can be read.
 * @param buffer Buffer object for music files containing ID3v1 tags
 * @returns ID3v1 object on success, undefined on failure
 */
export const id3v1 = (buffer: Uint8Array | ArrayBufferLike): ID3v1 | undefined => {
  //read last 128 bytes
  const view = createReaderView(buffer);
  try {
    //"TAG"
    if (!checkMagicId3v1(view)) {
      return undefined;
    }

    //next byte is the track
    const hasTrack = peek(getUint, 122)(view, 1) === 0;

    return {
      title: trimNull(getString(view, 30, EncAscii)),
      artist: trimNull(getString(view, 30, EncAscii)),
      album: trimNull(getString(view, 30, EncAscii)),
      year: trimNull(getString(view, 4, EncAscii)),
      comment: trimNull(getString(view, hasTrack ? 28 : 30, EncAscii)),
      track: hasTrack ? getUint(view, 2) : undefined,
      genre: getUint(view, 1),
    };
  } catch {
    return undefined;
  }
};
