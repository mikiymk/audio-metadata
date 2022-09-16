import * as utils from "./utils";

function checkMagicId3v1(view: DataView) {
  const id3Magic = utils.readBytes(view, view.byteLength - 128, 3);
  //"TAG"
  return id3Magic[0] === 84 && id3Magic[1] === 65 && id3Magic[2] === 71;
}

export function id3v1(buffer: any) {
  //read last 128 bytes
  const view = utils.createView(buffer);
  if (!checkMagicId3v1(view)) {
    return null;
  }

  function trim(value: string) {
    return value.replace(/[\s\0]+$/, "");
  }

  try {
    let offset = view.byteLength - 128 + 3;
    const title = utils.readAscii(view, offset, 30),
      artist = utils.readAscii(view, offset + 30, 30),
      album = utils.readAscii(view, offset + 60, 30),
      year = utils.readAscii(view, offset + 90, 4);

    offset += 94;

    let comment = utils.readAscii(view, offset, 28),
      track = null;
    offset += 28;
    if (view.getUint8(offset) === 0) {
      //next byte is the track
      track = view.getUint8(offset + 1);
    } else {
      comment += utils.readAscii(view, offset, 2);
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
}
