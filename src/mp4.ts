/**
 * https://wiki.multimedia.cx/index.php/QuickTime_container#Meta_Data
 */

import { createView } from "./utils";

/**
 * Read the mp4 tag from the buffer if it can be read.
 * @param buffer Buffer object for music files containing mp4 tags
 * @returns mp4 meta object on success, undefined on failure
 */
export const mp4 = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createView(buffer);

  return undefined;
};
