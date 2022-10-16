/**
 * See http://www.ietf.org/rfc/rfc3533.txt
 * @param buffer
 */

import { createView } from "./utils";

/**
 * Read the asf content description from the buffer if it can be read.
 * @param buffer Buffer object for music files containing description
 * @returns content description object on success, undefined on failure
 */
export const wma = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createView(buffer);

  return;
};
