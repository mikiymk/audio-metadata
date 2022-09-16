import { createView, readBytes, readUtf8, trimNull } from "./utils";

/**
 * See http://www.ietf.org/rfc/rfc3533.txt
 * @param {Buffer|ArrayBuffer} buffer
 */
export const ogg = (buffer: ArrayBufferLike): Record<string, string> | null => {
  const view = createView(buffer);

  const parsePage = (offset: number, withPacket?: boolean) => {
    if (view.byteLength < offset + 27) {
      return null;
    }

    const numPageSegments = view.getUint8(offset + 26),
      segmentTable = readBytes(view, offset + 27, numPageSegments),
      headerSize = 27 + numPageSegments;

    if (!segmentTable.length) {
      return null;
    }

    const pageSize =
        headerSize + segmentTable.reduce((cur, next) => cur + next),
      length = headerSize + 1 + "vorbis".length;
    let packetView = null;

    if (withPacket) {
      packetView = createView(new ArrayBuffer(pageSize - length));
      readBytes(view, offset + length, pageSize - length, packetView);
    }

    return {
      pageSize: pageSize,
      packet: packetView,
    };
  };

  const parseComments = (packet: DataView) => {
    try {
      const vendorLength = packet.getUint32(0, true),
        commentListLength = packet.getUint32(4 + vendorLength, true),
        comments: Record<string, string> = {},
        map = { tracknumber: "track" };
      let offset = 8 + vendorLength;

      for (let i = 0; i < commentListLength; i++) {
        const commentLength = packet.getUint32(offset, true),
          comment = readUtf8(packet, offset + 4, commentLength),
          equals = comment.indexOf("="),
          key = comment.substring(0, equals).toLowerCase();

        comments[map[key] || key] = comments[key] = trimNull(
          comment.substring(equals + 1)
        );
        offset += 4 + commentLength;
      }

      return comments;
    } catch (e) {
      //all exceptions are just malformed/truncated data, so we just ignore them
      return null;
    }
  };

  const id = parsePage(0);
  if (!id) {
    return null;
  }

  const commentHeader = parsePage(id.pageSize, true);
  if (!commentHeader) {
    return null;
  }

  return parseComments(commentHeader.packet);
};
