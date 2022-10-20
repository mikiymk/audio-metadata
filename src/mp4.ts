/**
 * https://wiki.multimedia.cx/index.php/QuickTime_container
 * https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFPreface/qtffPreface.html
 * https://atomicparsley.sourceforge.net/mpeg-4files.html
 * https://github.com/sannies/mp4parser/
 */

import { createReaderView, EncAscii, EncUtf16be, EncUtf8, getString, getUint, getView, moveRel, peek, ReaderView, restLength } from "./reader";

// moov trak mdia udta
// + meta
//   + ilst
//     + data

interface Atom {
  size: number;
  type: string;
  data: ReaderView;
}

const parseAtom = (view: ReaderView): Atom | undefined => {
  try {
    // if size == 1, atom has extended size
    // if size == 0, atom is last atom of container and size is reach to end
    const rawSize = getUint(view, 4);
    const type = getString(view, 4, EncAscii).toLowerCase();
    const size = rawSize === 1 ? getUint(view, 8) : rawSize || restLength(view);
    const headerSize = rawSize === 1 ? 16 : 8;

    return {
      size,
      type,
      data: getView(view, size - headerSize),
    };
  } catch {
    return undefined;
  }
};

const parseAtomList = function* (view: ReaderView): Generator<Atom> {
  let atom;
  let safetyCount = 0;

  while ((atom = parseAtom(view))) {
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

const parseItem = (view: ReaderView): string | undefined => {
  const data = [...parseAtomList(view)].find((value) => value.type === "data");

  if (data) {
    const itemData = data.data;
    const type = getUint(itemData, 4);
    moveRel(itemData, 4);

    const encode = {
      1: EncUtf8,
      2: EncUtf16be,
      4: EncUtf8,
      5: EncUtf16be,
    }[type];

    return encode && getString(itemData, restLength(itemData), encode);
  }
};

const parseItemList = (view: ReaderView): Record<string, string> => {
  let metadatas: Record<string, string> = {};

  for (const { data, type } of parseAtomList(view)) {
    const item = parseItem(data);
    if (item) {
      metadatas = { ...metadatas, [type]: item, [TypeMap[type] || type]: item };
    }
  }

  return metadatas;
};

const parseAtoms = (view: ReaderView): Record<string, string> => {
  let metadatas: Record<string, string> = {};

  for (const { type, data } of parseAtomList(view)) {
    metadatas = { ...metadatas, ...atomsDetailParsers[type]?.(data) };
  }

  return metadatas;
};

const atomsDetailParsers: Record<string, (view: ReaderView) => Record<string, string>> = {
  moov: parseAtoms,
  trak: parseAtoms,
  mdia: parseAtoms,
  udta: parseAtoms,
  meta: (data: ReaderView) => parseAtoms(metaBoxShift(data)),
  ilst: parseItemList,
};

const metaBoxShift = (view: ReaderView): ReaderView => {
  const type = peek(getString, 4)(view, 4, EncAscii);
  const handler = peek(getString, 16)(view, 4, EncAscii);

  if (type === "hdlr" && handler === "mdta") {
    return view;
  }
  moveRel(view, 4);
  return view;
};

/**
 * Read the mp4 tag from the buffer if it can be read.
 * @param buffer Buffer object for music files containing mp4 tags
 * @returns mp4 meta object on success, undefined on failure
 */
export const mp4 = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createReaderView(buffer);

  const metadata = parseAtoms(view);

  return Object.keys(metadata).length === 0 ? undefined : metadata;
};
