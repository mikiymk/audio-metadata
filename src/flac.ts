/**
 * Flac file
 * https://xiph.org/flac/format.html
 */

import { createView } from "./utils";

/**
 * Read the flac METADATA_BLOCK_VORBIS_COMMENT from the buffer if it can be read.
 * @param buffer Buffer object for music files containing Vorbis Comment tags
 * @returns Vorbis Comment object on success, undefined on failure
 */
export const flac = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createView(buffer);

  return;
};
