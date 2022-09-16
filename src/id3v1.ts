import { readBytes, createView, readAscii } from "./utils";

const checkMagicId3v1 = (view: DataView): boolean => {
  const id3Magic = readBytes(view, view.byteLength - 128, 3);
  //"TAG"
  return id3Magic[0] === 84 && id3Magic[1] === 65 && id3Magic[2] === 71;
};

export const id3v1 = (
  buffer: ArrayBufferLike
): {
  title: string;
  artist: string;
  album: string;
  year: string;
  comment: string;
  track: number | null;
  genre: number;
} | null => {
  //read last 128 bytes
  const view = createView(buffer);
  if (!checkMagicId3v1(view)) {
    return null;
  }

  const trim = (value: string) => {
    return value.replace(/[\s\0]+$/, "");
  };

  try {
    let offset = view.byteLength - 128 + 3;
    const title = readAscii(view, offset, 30),
      artist = readAscii(view, offset + 30, 30),
      album = readAscii(view, offset + 60, 30),
      year = readAscii(view, offset + 90, 4);

    offset += 94;

    let comment = readAscii(view, offset, 28),
      track = null;
    offset += 28;
    if (view.getUint8(offset) === 0) {
      //next byte is the track
      track = view.getUint8(offset + 1);
    } else {
      comment += readAscii(view, offset, 2);
    }

    offset += 2;
    const genre = view.getUint8(offset);
    return {
      title: trim(title),
      artist: trim(artist),
      album: trim(album),
      year: trim(year),
      comment: trim(comment),
      track: track,
      genre: genre,
    };
  } catch (e) {
    return null;
  }
};
