/**
 * https://wiki.hydrogenaud.io/index.php?title=APEv2_specification
 */

import { checkMagicId3v1, checkMagicId3v12, checkMagicId3v1Enhanced } from "./id3v1";
import { createReaderView, EncAscii, EncUtf8, getString, getUint, moveRel, peek, ReaderView } from "./reader";
import { CommonKeys, mapTag } from "./tagmap";

/**
 * Check if ReaderView contains Ape tag v2
 * @param view ReaderView, position is after Ape tag v2
 * @returns true if it contains Ape tag v2, false if it does not
 */
const checkMagicApev2 = (view: ReaderView): boolean => {
  return peek(getString, -32)(view, 8, EncAscii) === "APETAGEX";
};

type APEv2 = Record<string, string>;

const TagMap: Record<string, CommonKeys> = {
  "album artist": "albumartist",
};

/**
 * Read the APEv2 tag from the buffer if it can be read.
 * @param buffer Buffer object for music files containing APEv2 tags
 * @returns APEv2 object on success, undefined on failure
 */
export const apev2 = (buffer: Uint8Array | ArrayBufferLike): APEv2 | undefined => {
  const view = createReaderView(buffer);
  try {
    // Ape tag located before ID3v1
    if (checkMagicId3v1(view)) {
      moveRel(view, -128);
    }

    if (checkMagicId3v12(view)) {
      moveRel(view, -128);
    }

    if (checkMagicId3v1Enhanced(view)) {
      moveRel(view, -227);
    }

    if (!checkMagicApev2(view)) {
      return undefined;
    }

    const tagSize = peek(getUint, -20)(view, 4, true);
    const tagCount = peek(getUint, -16)(view, 4, true);

    const items: Record<string, string> = {};
    moveRel(view, -tagSize);

    for (let i = 0; i < tagCount; i++) {
      const valueSize = getUint(view, 4, true);
      moveRel(view, 4);

      let key = "";
      for (;;) {
        const char = getString(view, 1, EncAscii);
        if (char === "\0") break;
        key += char;
      }
      const value = getString(view, valueSize, EncUtf8);

      mapTag(items, TagMap, key.toLowerCase(), value);
    }

    return items;
  } catch {
    return undefined;
  }
};
