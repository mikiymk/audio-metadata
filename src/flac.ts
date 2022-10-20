/**
 * Flac file
 * https://xiph.org/flac/format.html
 */

import { parseComments } from "./ogg";
import { createReaderView, EncAscii, getString, getUint, getView, moveRel } from "./reader";

/**
 * Read the flac METADATA_BLOCK_VORBIS_COMMENT from the buffer if it can be read.
 * @param buffer Buffer object for music files containing Vorbis Comment tags
 * @returns Vorbis Comment object on success, undefined on failure
 */
export const flac = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createReaderView(buffer);

  if (getString(view, 4, EncAscii) !== "fLaC") return undefined;

  let reachEnd = false;
  let comment: Record<string, string> = {};

  while (!reachEnd) {
    const type = getUint(view, 1);
    const length = getUint(view, 2) * 2 ** 8 + getUint(view, 1);

    reachEnd = type > 0x7f;

    if ((type & 0x7f) == 4) {
      // vorbis comment
      comment = Object.assign(comment, parseComments(getView(view, length)));
    } else {
      moveRel(view, length);
    }
  }

  return comment;
};
