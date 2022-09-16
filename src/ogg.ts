import { createView, readBytes, readUtf8, trimNull } from "./utils";

const parsePage = (view: DataView, offset: number): { pageSize: number; packet: DataView } | undefined => {
  if (view.byteLength < offset + 27) {
    return undefined;
  }

  const numPageSegments = view.getUint8(offset + 26),
    segmentTable = readBytes(view, offset + 27, numPageSegments),
    headerSize = 27 + numPageSegments;

  if (!segmentTable.length) {
    return undefined;
  }

  const pageSize = headerSize + segmentTable.reduce((cur, next) => cur + next),
    length = headerSize + 1 + "vorbis".length,
    packet = createView(new Uint8Array(readBytes(view, offset + length, pageSize - length)));

  return { pageSize, packet };
};

const parseComments = (packet: DataView): Record<string, string> | undefined => {
  try {
    const vendorLength = packet.getUint32(0, true),
      commentListLength = packet.getUint32(4 + vendorLength, true),
      comments: Record<string, string> = {},
      map: Record<string, string> = { tracknumber: "track" };

    for (let i = 0, offset = 8 + vendorLength; i < commentListLength; i++) {
      const commentLength = packet.getUint32(offset, true),
        comment = readUtf8(packet, offset + 4, commentLength),
        equals = comment.indexOf("="),
        key = comment.substring(0, equals).toLowerCase();

      comments[map[key] || key] = comments[key] = trimNull(comment.substring(equals + 1));
      offset += 4 + commentLength;
    }

    return comments;
  } catch (e) {
    //all exceptions are just malformed/truncated data, so we just ignore them
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
  const view = createView(buffer);

  const id = parsePage(view, 0);
  if (!id) {
    return undefined;
  }

  const commentHeader = parsePage(view, id.pageSize);
  if (!commentHeader) {
    return undefined;
  }

  return parseComments(commentHeader.packet);
};
