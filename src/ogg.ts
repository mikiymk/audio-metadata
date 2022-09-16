const utils = require("./utils");

/**
 * See http://www.ietf.org/rfc/rfc3533.txt
 * @param {Buffer|ArrayBuffer} buffer
 */
module.exports = function (buffer: any) {
  const view = utils.createView(buffer);

  function parsePage(offset: number, withPacket: boolean | undefined) {
    if (view.byteLength < offset + 27) {
      return null;
    }

    const numPageSegments = view.getUint8(offset + 26),
      segmentTable = utils.readBytes(view, offset + 27, numPageSegments),
      headerSize = 27 + numPageSegments;

    if (!segmentTable.length) {
      return null;
    }

    let pageSize =
        headerSize +
        segmentTable.reduce(function (cur: any, next: any) {
          return cur + next;
        }),
      length = headerSize + 1 + "vorbis".length,
      packetView = null;

    if (withPacket) {
      packetView = utils.createView(new ArrayBuffer(pageSize - length));
      utils.readBytes(view, offset + length, pageSize - length, packetView);
    }

    return {
      pageSize: pageSize,
      packet: packetView,
    };
  }

  function parseComments(packet: {
    getUint32: (arg0: number, arg1: boolean) => any;
  }) {
    try {
      let vendorLength = packet.getUint32(0, true),
        commentListLength = packet.getUint32(4 + vendorLength, true),
        comments = {},
        offset = 8 + vendorLength,
        map = {
          tracknumber: "track",
        };

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
};
