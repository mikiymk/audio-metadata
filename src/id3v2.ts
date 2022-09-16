import { readBytes, createView, readAscii, readUtf8, trimNull } from "./utils";

const checkMagicId3 = (view: DataView, offset: number): boolean => {
  const id3Magic = readBytes(view, offset, 3);
  //"ID3"
  return id3Magic[0] === 73 && id3Magic[1] === 68 && id3Magic[2] === 51;
};

const getUint28 = (view: DataView, offset: number): number => {
  const sizeBytes = readBytes(view, offset, 4);
  const mask = 0xfffffff;
  return (
    ((sizeBytes[0] & mask) << 21) |
    ((sizeBytes[1] & mask) << 14) |
    ((sizeBytes[2] & mask) << 7) |
    (sizeBytes[3] & mask)
  );
};

//http://id3.org/id3v2.3.0
//http://id3.org/id3v2.4.0-structure
//http://id3.org/id3v2.4.0-frames
export const id3v2 = (
  buffer: ArrayBufferLike
): Record<string, string> | null => {
  const view = createView(buffer);
  if (!checkMagicId3(view, 0)) {
    return null;
  }

  let offset = 3;
  //var majorVersion = view.getUint8(offset);
  offset += 2;
  const flags = view.getUint8(offset);
  offset++;
  const size = getUint28(view, offset);
  offset += 4;

  const extendedHeader = (flags & 128) > 0;

  if (extendedHeader) {
    offset += getUint28(view, offset);
  }

  const readFrame = (offset: number) => {
    try {
      const id = readAscii(view, offset, 4);
      const size = getUint28(view, offset + 4);
      offset += 10; //+2 more for flags we don't care about

      if (id[0] !== "T") {
        return {
          id: id,
          size: size + 10,
        };
      }

      const encoding = view.getUint8(offset);
      let data = "";

      if (encoding <= 3) {
        offset++;
        if (encoding === 3) {
          //UTF8 - null terminated
          data = readUtf8(view, offset, size - 1);
        } else {
          //ISO-8859-1, UTF-16, UTF-16BE
          //UTF-16 and UTF-16BE are $FF $00 terminated
          //ISO is null terminated

          //screw these encodings, read it as ascii
          data = readAscii(view, offset, size - 1);
        }
      } else {
        //no encoding info, read it as ascii
        data = readAscii(view, offset, size);
      }

      //id3v2.4 is supposed to have encoding terminations, but sometimes
      //they don't? meh.
      data = trimNull(data);

      return {
        id: id,
        size: size + 10,
        content: data,
      };
    } catch (e) {
      return null;
    }
  };

  const idMap = {
    TALB: "album",
    TCOM: "composer",
    TIT1: "title",
    TIT2: "title",
    TPE1: "artist",
    TRCK: "track",
    TSSE: "encoder",
    TDRC: "year",
    TCON: "genre",
  };

  const endOfTags = offset + size,
    frames: Record<string, string> = {};
  while (offset < endOfTags) {
    const frame = readFrame(offset);
    if (!frame) {
      break;
    }

    offset += frame.size;
    if (!frame.content) {
      continue;
    }
    let id = idMap[frame.id] || frame.id;
    if (id === "TXXX") {
      const nullByte = frame.content.indexOf("\u0000");
      id = frame.content.substring(0, nullByte);
      frames[id] = frame.content.substring(nullByte + 1);
    } else {
      frames[id] = frames[frame.id] = frame.content;
    }
  }

  return frames;
};
