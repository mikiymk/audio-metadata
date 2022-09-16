import { createView, readAscii, trimNull } from "./utils";

const checkMagicId3v1 = (view: DataView): boolean => {
  const id3Magic = readAscii(view, view.byteLength - 128, 3);
  //"TAG"
  return id3Magic === "TAG";
};

type ID3v1 = {
  title: string;
  artist: string;
  album: string;
  year: string;
  comment: string;
  track: number | undefined;
  genre: number;
};

export const id3v1 = (buffer: Uint8Array | ArrayBufferLike): ID3v1 | undefined => {
  //read last 128 bytes
  const view = createView(buffer);
  if (!checkMagicId3v1(view) || view.byteLength < 128) {
    return undefined;
  }

  const offset = view.byteLength - 128;
  //next byte is the track
  const hasTrack = view.getUint8(offset + 125) === 0;
  const title = trimNull(readAscii(view, offset + 3, 30)),
    artist = trimNull(readAscii(view, offset + 33, 30)),
    album = trimNull(readAscii(view, offset + 63, 30)),
    year = trimNull(readAscii(view, offset + 93, 4)),
    comment = trimNull(readAscii(view, offset + 97, hasTrack ? 28 : 30)),
    track = hasTrack ? view.getUint8(offset + 126) : undefined,
    genre = view.getUint8(offset + 127);

  return { title, artist, album, year, comment, track, genre };
};
