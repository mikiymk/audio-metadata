/**
 * Flac file
 * https://xiph.org/flac/format.html
 */

import { parseComments } from "./ogg";
import { createView, readAscii, readBytes } from "./utils";

const checkMagicFlac = (view: DataView): boolean => {
  const magic = readAscii(view, 0, 4);
  return magic === "fLaC";
};

/**
 * Read the flac METADATA_BLOCK_VORBIS_COMMENT from the buffer if it can be read.
 * @param buffer Buffer object for music files containing Vorbis Comment tags
 * @returns Vorbis Comment object on success, undefined on failure
 */
export const flac = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createView(buffer);

  if (!checkMagicFlac(view)) return undefined;

  let offset = 4;
  let reachEnd = false;
  let comment: Record<string, string> = {};

  while (!reachEnd) {
    const type = view.getUint8(offset);
    const length = view.getUint16(offset + 1) * 2 ** 16 + view.getUint8(offset + 3);

    reachEnd = type > 0x7f;

    if ((type & 0b0111_1111) == 4) {
      // vorbis comment
      comment = Object.assign(comment, parseComments(createView(readBytes(view, offset + 4, length))));
    }
    offset += 4 + length;
  }

  return comment;
};
