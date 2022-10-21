import { createReaderView, getBytes, getString, getUint, getView, moveRel, ReaderView, restLength } from "./reader";
import { CommonKeys, mapTag } from "./tagmap";
import { splitTwo, trimNull } from "./utils";

interface Page {
  pageSize: number;
  packet: ReaderView;
}

const parsePage = (view: ReaderView): Page | undefined => {
  if (restLength(view) < 27) {
    return undefined;
  }

  const segmentsSize = (moveRel(view, 26), getUint(view, 1)),
    segmentTable = getBytes(view, segmentsSize);

  if (!segmentTable.length) {
    return undefined;
  }

  const pageSize = segmentTable.reduce((cur, next) => cur + next);

  // 7 = 1 + "vorbis".length,
  return moveRel(view, 7), { pageSize: pageSize + 27 + segmentsSize, packet: getView(view, pageSize - 7) };
};

export const parseComments = (packet: ReaderView): Record<string, string> | undefined => {
  try {
    const vendorLength = getUint(packet, 4, true),
      commentListLength = (moveRel(packet, vendorLength), getUint(packet, 4, true)),
      comments: Record<string, string> = {},
      map: Record<string, CommonKeys> = { tracknumber: "track" };

    for (let i = 0; i < commentListLength; i++) {
      const commentLength = getUint(packet, 4, true),
        comment = getString(packet, commentLength),
        [key, value] = splitTwo(comment, "=");

      mapTag(comments, map, key.toLowerCase(), trimNull(value));
    }

    return comments;
  } catch {
    // all exceptions are just malformed/truncated data, so we just ignore them
    return undefined;
  }
};

/**
 * See http://www.ietf.org/rfc/rfc3533.txt
 * @param buffer
 */
/**
 * Read the Vorbis Comment tag from the buffer if it can be read.
 * @param buffer Buffer object for music files containing Vorbis Comment tags
 * @returns Vorbis Comment object on success, undefined on failure
 */
export const ogg = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createReaderView(buffer);

  const id = parsePage(view);
  if (!id) {
    return undefined;
  }

  const commentHeader = parsePage(view);
  if (commentHeader) {
    return parseComments(commentHeader.packet);
  }
};
