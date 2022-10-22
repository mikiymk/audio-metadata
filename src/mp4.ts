/**
 * https://wiki.multimedia.cx/index.php/QuickTime_container
 * https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFPreface/qtffPreface.html
 * https://atomicparsley.sourceforge.net/mpeg-4files.html
 * https://github.com/sannies/mp4parser/
 */

import { createReaderView, EncAscii, EncUtf16be, EncUtf8, getString, getUint, getView, moveRel, peek, ReaderView, restLength } from "./reader";
import { CommonKeys, mapTag } from "./tagmap";

// moov trak mdia udta
// + meta
//   + ilst
//     + data

interface Atom {
  size: number;
  type: string;
  data: ReaderView;
}

/**
 * read MP4 box
 *
 * | size    | tag                                  |
 * | ------- | ------------------------------------ |
 * | 4 bytes | box size                             |
 * | 4 bytes | box type                             |
 * | 8 bytes | extended box size (if box size == 1) |
 * | n bytes | box data                             |
 *
 * @param view ReaderView contains MP4 box
 * @returns MP4 box object on success, undefined on failure
 */
const parseAtom = (view: ReaderView): Atom | undefined => {
  try {
    // if size == 1, atom has extended size
    // if size == 0, atom is last atom of container and size is reach to end
    const rawSize = getUint(view, 4);
    const type = getString(view, 4, EncAscii);
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

/**
 * read multiple MP4 boxes
 * @param view ReaderView contains MP4 boxes
 */
const parseAtomList = function* (view: ReaderView): Generator<Atom> {
  let atom;
  let safetyCount = 0;

  while ((atom = parseAtom(view))) {
    if (safetyCount++ > 100) break;

    yield atom;
  }
};

/**
 * MP4 tag map to common tag
 *
 * ref: https://wiki.hydrogenaud.io/index.php?title=Tag_Mapping
 */
const TypeMap: Record<string, CommonKeys> = {
  "©nam": "title",
  "©alb": "album",
  "©ART": "artist",
  aART: "albumartist",
  "©wrt": "composer",
  "©com": "composer",
  trkn: "track",
  disk: "disc",
  "©day": "year",
  "©too": "encoder",
  "©gen": "genre",
  gnre: "genre",
  "©cmt": "comment",
};

/**
 * read text information from MP4 data box in MP4 box list
 * @param view ReaderView contains MP4 data box
 * @returns data string in MP4 data box or undefined
 */
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

/**
 * read MP4 tag object from MP4 ilst box
 * @param view ReaderView, MP4 ilst box data
 * @returns MP4 tag object in MP4 box
 */
const parseItemList = (view: ReaderView): Record<string, string> => {
  const metadatas: Record<string, string> = {};

  for (const { data, type } of parseAtomList(view)) {
    const item = parseItem(data);
    if (item) {
      mapTag(metadatas, TypeMap, type, item);
    }
  }

  return metadatas;
};

/**
 * read MP4 tag object from MP4 box
 * @param view ReaderView contains MP4 boxes
 * @returns MP4 tag object in MP4 box
 */
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

/**
 * if MP4 meta box follows QuickTime specification, meta box contains only box list,
 * if follows MP4 specification, meta box contains version and flags before box list.
 * @param view ReaderView contains MP4 meta box data
 * @returns same as argument ReaderView
 */
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
