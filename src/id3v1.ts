import { createReaderView, EncAscii, getString, getUint, moveRel, peek, ReaderView } from "./reader";
import { trimNull } from "./utils";

/**
 * Check if ReaderView contains ID3v1
 * @param view ReaderView, position is after ID3v1
 * @returns true if it contains ID3v1, false if it does not
 */
export const checkMagicId3v1 = (view: ReaderView): boolean => {
  return peek(getString, -128)(view, 3, EncAscii) === "TAG";
};

/**
 * Check if ReaderView contains ID3v1.2
 * @param view ReaderView, position is after ID3v1.2 extension
 * @returns true if it contains ID3v1.2, false if it does not
 */
export const checkMagicId3v12 = (view: ReaderView): boolean => {
  return peek(getString, -128)(view, 3, EncAscii) === "EXT";
};

/**
 * Check if ReaderView contains Enhanced ID3v1
 * @param view ReaderView, position is after Enhanced ID3v1 extension
 * @returns true if it contains Enhanced ID3v1 extension, false if it does not
 */
export const checkMagicId3v1Enhanced = (view: ReaderView): boolean => {
  return peek(getString, -128)(view, 4, EncAscii) === "TAG+";
};

/**
 * ID3v1 tag data
 */
export interface ID3v1 {
  title: string;
  artist: string;
  album: string;
  year: string;
  comment: string;
  track: number | undefined;
  genre: number;
}

/**
 * on ID3v1.2 or Enhanced ID3v1 extensions contains
 * last half of title, artist, album and comment
 */
interface ID3v1Extended {
  ttl?: string;
  ast?: string;
  alb?: string;
  com?: string;
}

/**
 * on ID3v1.2 or Enhanced ID3v1 extensions contains
 * additional data
 */
interface ID3v1Enhanced {
  subgenre?: string;
  speed?: number;
  startTime?: string;
  endTime?: string;
}

/**
 * Read the ID3v1 tag from the last 128 bytes of the buffer if it can be read.
 * @param buffer Buffer object for music files containing ID3v1 tags
 * @returns ID3v1 object on success, undefined on failure
 */
export const id3v1 = (buffer: Uint8Array | ArrayBufferLike): (ID3v1 & ID3v1Enhanced) | undefined => {
  // read last 128 bytes
  const view = createReaderView(buffer);
  try {
    //"TAG"
    if (!checkMagicId3v1(view)) {
      return undefined;
    }
    moveRel(view, -128);

    let extendedData: ID3v1Extended = {};
    let enhancedData: ID3v1Enhanced = {};
    if (checkMagicId3v12(view)) {
      moveRel(view, -125);
      extendedData = {
        ttl: getString(view, 30, EncAscii),
        ast: getString(view, 30, EncAscii),
        alb: getString(view, 30, EncAscii),
        com: getString(view, 15, EncAscii),
      };
      enhancedData = {
        subgenre: trimNull(getString(view, 20, EncAscii)),
      };
    }
    if (checkMagicId3v1Enhanced(view)) {
      moveRel(view, -223);
      extendedData = {
        ttl: getString(view, 60, EncAscii),
        ast: getString(view, 60, EncAscii),
        alb: getString(view, 60, EncAscii),
      };
      enhancedData = {
        speed: getUint(view, 1),
        subgenre: trimNull(getString(view, 30, EncAscii)),
        startTime: trimNull(getString(view, 6, EncAscii)),
        endTime: trimNull(getString(view, 6, EncAscii)),
      };
    }
    moveRel(view, 3);

    //next byte is the track
    const hasTrack = peek(getUint, 122)(view, 1) === 0;

    return {
      title: trimNull(getString(view, 30, EncAscii) + (extendedData.ttl ?? "")),
      artist: trimNull(getString(view, 30, EncAscii) + (extendedData.ast ?? "")),
      album: trimNull(getString(view, 30, EncAscii) + (extendedData.alb ?? "")),
      year: trimNull(getString(view, 4, EncAscii)),
      comment: trimNull(getString(view, hasTrack ? 28 : 30, EncAscii) + (extendedData.com ?? "")),
      track: hasTrack ? getUint(view, 2) : undefined,
      genre: getUint(view, 1),
      ...enhancedData,
    };
  } catch {
    return undefined;
  }
};
