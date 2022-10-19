/**
 * https://wiki.multimedia.cx/index.php/QuickTime_container
 * https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFPreface/qtffPreface.html
 * https://atomicparsley.sourceforge.net/mpeg-4files.html
 * https://github.com/sannies/mp4parser/
 */

import { createView, readAscii, readBytes, readUtf16be, readUtf8 } from "./utils";

// moov trak mdia udta
// + meta
//   + ilst

interface Atom {
  size: number;
  type: string;
  data: DataView;
}

const parseAtom = (view: DataView, offset: number): Atom | undefined => {
  try {
    // if size == 1, atom has extended size
    // if size == 0, atom is last atom of container and size is reach to end
    const rawSize = view.getUint32(offset);
    const size = rawSize === 1 ? Number(view.getBigUint64(offset + 8)) : rawSize || view.byteLength - offset;
    const headerSize = rawSize === 1 ? 16 : 8;

    return {
      size,
      type: readAscii(view, offset + 4, 4).toLowerCase(),
      data: createView(readBytes(view, offset + headerSize, size - headerSize)),
    };
  } catch {
    return undefined;
  }
};

const parseAtomList = function* (view: DataView): Generator<Atom> {
  let atom;
  let offset = 0;
  let safetyCount = 0;

  while ((atom = parseAtom(view, (offset += atom?.size ?? 0)))) {
    if (safetyCount++ > 100) break;

    yield atom;
  }
};

const TypeMap: Record<string, string> = {
  "©alb": "album",
  "©wrt": "composer",
  "©nam": "title",
  "©art": "artist",
  aart: "albumartist",
  "©cmt": "comment",
  trkn: "track",
  "©too": "encoder",
  "©day": "year",
  "©gen": "genre",
  gnre: "genre",
};

const parseItem = (view: DataView): string | undefined => {
  const data = [...parseAtomList(view)].find((value) => value.type === "data");

  if (data) {
    switch (data.data.getUint32(0)) {
      case 1:
      case 4:
        return readUtf8(data.data, 8, data.data.byteLength - 8);
      case 2:
      case 5:
        return readUtf16be(data.data, 8, data.data.byteLength - 8);
    }
  }
};
const parseItemList = (view: DataView): Record<string, string> => {
  const metadatas: Record<string, string> = {};

  for (const atom of parseAtomList(view)) {
    Object.assign(metadatas, {
      [atom.type]: parseItem(atom.data),
      [TypeMap[atom.type] || atom.type]: parseItem(atom.data),
    });
  }

  return metadatas;
};

const parseAtoms = (view: DataView): Record<string, string> => {
  const metadatas: Record<string, string> = {};

  for (const atom of parseAtomList(view)) {
    switch (atom.type) {
      case "moov":
      case "trak":
      case "mdia":
      case "udta":
        Object.assign(metadatas, parseAtoms(atom.data));
        break;

      case "meta":
        Object.assign(metadatas, parseAtoms(metaBoxShift(atom.data)));
        break;

      case "ilst":
        Object.assign(metadatas, parseItemList(atom.data));
        break;

      default:
    }
  }

  return metadatas;
};

const metaBoxShift = (view: DataView): DataView => {
  const type = readAscii(view, 4, 4);
  const handler = readAscii(view, 16, 4);

  if (type === "hdlr" && handler === "mdta") {
    return view;
  }
  return createView(readBytes(view, 4, view.byteLength - 4));
};

/**
 * Read the mp4 tag from the buffer if it can be read.
 * @param buffer Buffer object for music files containing mp4 tags
 * @returns mp4 meta object on success, undefined on failure
 */
export const mp4 = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createView(buffer);

  const metadata = parseAtoms(view);

  return Object.keys(metadata).length === 0 ? undefined : metadata;
};
