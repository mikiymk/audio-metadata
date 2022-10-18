/**
 * https://wiki.multimedia.cx/index.php/QuickTime_container
 * https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFPreface/qtffPreface.html
 * https://atomicparsley.sourceforge.net/mpeg-4files.html
 * https://github.com/sannies/mp4parser/
 */

import { createView, readAscii, readBytes } from "./utils";

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
      type: readAscii(view, offset + 4, 4),
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

type Metadata = unknown;

const parseAtoms = (view: DataView): Metadata[] => {
  const metadatas: Metadata[] = [];

  for (const atom of parseAtomList(view)) {
    switch (atom.type) {
      case "moov":
      case "trak":
      case "mdia":
      case "udta":
      case "ilst":
        metadatas.push(atom, parseAtoms(atom.data));
        break;

      case "meta":
        metadatas.push(atom, parseAtoms(metaBoxShift(atom.data)));
        break;

      default:
        metadatas.push(atom);
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

  return metadata;
};
