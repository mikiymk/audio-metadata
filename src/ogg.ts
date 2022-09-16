import * as utils from "./utils";

/**
 * See http://www.ietf.org/rfc/rfc3533.txt
 * @param {Buffer|ArrayBuffer} buffer
 */
export function ogg(buffer: any) {
  const view = utils.createView(buffer);

  function parsePage(offset: number, withPacket?: boolean) {
    if (view.byteLength < offset + 27) {
      return null;
    }

    const numPageSegments = view.getUint8(offset + 26),
      segmentTable = utils.readBytes(view, offset + 27, numPageSegments),
      headerSize = 27 + numPageSegments;

    if (!segmentTable.length) {
      return null;
    }

    const pageSize =
        headerSize +
        segmentTable.reduce(function (cur: any, next: any) {
          return cur + next;
        }),
      length = headerSize + 1 + "vorbis".length;
    let packetView = null;

    if (withPacket) {
      packetView = utils.createView(new ArrayBuffer(pageSize - length));
      utils.readBytes(view, offset + length, pageSize - length, packetView);
    }

    return {
      pageSize: pageSize,
      packet: packetView,
    };
  }

  function parseComments(packet: DataView) {
    try {
      const vendorLength = packet.getUint32(0, true),
        commentListLength = packet.getUint32(4 + vendorLength, true),
        comments: Record<string, string> = {},
        map = { tracknumber: "track" };
      let offset = 8 + vendorLength;

      for (let i = 0; i < commentListLength; i++) {
        const commentLength = packet.getUint32(offset, true),
          comment = utils.readUtf8(packet, offset + 4, commentLength),
          equals = comment.indexOf("="),
          key = comment.substring(0, equals).toLowerCase();

        comments[map[key] || key] = comments[key] = utils.trimNull(
          comment.substring(equals + 1)
        );
        offset += 4 + commentLength;
      }

      return comments;
    } catch (e) {
      //all exceptions are just malformed/truncated data, so we just ignore them
      return null;
    }
  }

  const id = parsePage(0);
  if (!id) {
    return null;
  }

  const commentHeader = parsePage(id.pageSize, true);
  if (!commentHeader) {
    return null;
  }

  return parseComments(commentHeader.packet);
}
