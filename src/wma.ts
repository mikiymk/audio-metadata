/**
 * https://learn.microsoft.com/en-us/windows/win32/wmformat/overview-of-the-asf-format
 */

import { createReaderView, EncUtf16le, getBytes, getString, getUint, getView, moveRel, ReaderView } from "./reader";
import { CommonKeys, mapTag } from "./tagmap";
import { trimNull } from "./utils";

/**
 * read GUID as Hex string
 * @param view ReaderView contains GUID
 * @returns GUID bytes string
 */
const getHexString = (view: ReaderView): string => {
  return "G" + getBytes(view, 16).reduce((prev, curr) => prev + curr.toString(16).padStart(2, "0").toUpperCase(), "");
};

interface AsfObject {
  guid: string;
  size: number;
  data: ReaderView;
}

/**
 * read ASF object
 *
 * | size     | tag         |
 * | -------- | ----------- |
 * | 16 bytes | object GUID |
 * |  8 bytes | object size |
 * |  n bytes | object data |
 *
 * @param view ReaderView contains ASF object
 * @returns ASF object object on success, undefined on failure
 */
const parseAsfObject = (view: ReaderView): AsfObject | undefined => {
  try {
    const guid = getHexString(view);
    const size = getUint(view, 8, true);
    const data = getView(view, size - 24);

    return { guid, size, data };
  } catch {
    return undefined;
  }
};

/**
 * read ASF Content Description object
 *
 * | size    | tag                |
 * | ------- | ------------------ |
 * | 2 bytes | title length       |
 * | 2 bytes | author length      |
 * | 2 bytes | copyright length   |
 * | 2 bytes | description length |
 * | 2 bytes | rating length      |
 * | n bytes | title              |
 * | n bytes | author             |
 * | n bytes | copyright          |
 * | n bytes | description        |
 * | n bytes | rating             |
 *
 * @param view ReaderView contains ASF Content Description object
 * @returns ASF tags on success, undefined on failure
 */
const parseContentDescription = (view: ReaderView) => {
  const titleLen = getUint(view, 2, true);
  const authorLen = getUint(view, 2, true);
  const copyrightLen = getUint(view, 2, true);
  const descriptionLen = getUint(view, 2, true);
  const ratingLen = getUint(view, 2, true);

  return {
    title: trimNull(getString(view, titleLen, EncUtf16le)),
    artist: trimNull(getString(view, authorLen, EncUtf16le)),
    copyright: trimNull(getString(view, copyrightLen, EncUtf16le)),
    comment: trimNull(getString(view, descriptionLen, EncUtf16le)),
    rating: trimNull(getString(view, ratingLen, EncUtf16le)),
  };
};

const DescriptionMap: Record<string, CommonKeys> = {
  albumtitle: "album",
  tracknumber: "track",
  partofset: "disc",
  toolname: "encoder",
  comments: "comment",
};

/**
 * set formed tag to tags object if type is UTF-8 string
 * @param descriptions ASF tags object
 * @param type value type, 0x00 = UTF-8
 * @param name set tag name
 * @param description set tag value
 */
const setDescription = (descriptions: Record<string, string>, type: number, name: string, description: string) => {
  name = trimNull(name).toLowerCase();
  name = name.startsWith("wm/") ? name.slice(3) : name;

  switch (type) {
    case 0:
      mapTag(descriptions, DescriptionMap, name, trimNull(description));
      break;

    default:
  }
};

/**
 * read ASF Extended Content Description object
 *
 * | size     | tag                |
 * | -------- | ------------------ |
 * | 2 bytes  | descriptions count |
 * | * repeat |                    |
 * | 2 bytes  | name length        |
 * | n bytes  | name               |
 * | 2 bytes  | value type         |
 * | 2 bytes  | value length       |
 * | n bytes  | value              |
 * | *        |                    |
 *
 * @param view ReaderView contains ASF Extended Content Description object
 * @returns ASF tags on success, undefined on failure
 */
const parseExtendedContentDescription = (view: ReaderView) => {
  const descriptions: Record<string, string> = {};
  const count = getUint(view, 2, true);

  for (let i = 0; i < count; i++) {
    const nameLen = getUint(view, 2, true);
    const name = getString(view, nameLen, EncUtf16le);
    const valueType = getUint(view, 2, true);
    const valueLen = getUint(view, 2, true);
    const description = getString(view, valueLen, EncUtf16le);

    setDescription(descriptions, valueType, name, description);
  }

  return descriptions;
};

/**
 * read ASF Header Extension object
 * @param view ReaderView contains ASF Header Extension object
 * @returns ASF tags on success, undefined on failure
 */
const parseHeaderExtension = (view: ReaderView) => {
  moveRel(view, 22);
  let descriptions: Record<string, string> = {};

  let object;
  while ((object = parseAsfObject(view))) {
    const parserObjects: Record<string, (view: ReaderView) => Record<string, string>> = {
      // ASF Metadata Object: C5F8CBEA-5BAF-4877-8467-AA8C44FA4CCA
      GEACBF8C5AF5B48778467AA8C44FA4CCA: parseMetadata,
      // ASF Metadata Library Object: 44231C94-9498-49D1-A141-1D134E457054
      G941C23449894D149A1411D134E457054: parseMetadata,
    };
    descriptions = { ...descriptions, ...parserObjects[object.guid]?.(object.data) };
  }

  return descriptions;
};

/**
 * read ASF Metadata object and ASF Metadata Library object
 *
 * | size     | tag                |
 * | -------- | ------------------ |
 * | 2 bytes  | descriptions count |
 * | * repeat |                    |
 * | 2 bytes  | reserved           |
 * | 2 bytes  | stream number      |
 * | 2 bytes  | name length        |
 * | 2 bytes  | value type         |
 * | 2 bytes  | value length       |
 * | n bytes  | name               |
 * | n bytes  | value              |
 * | *        |                    |
 *
 * @param view ReaderView contains ASF Metadata object
 * @returns ASF tags on success, undefined on failure
 */
const parseMetadata = (view: ReaderView) => {
  const descriptions: Record<string, string> = {};
  const count = getUint(view, 2, true);

  for (let i = 0; i < count; i++) {
    moveRel(view, 4); // reserved and stream number
    const nameLen = getUint(view, 2, true);
    const valueType = getUint(view, 2, true);
    const valueLen = getUint(view, 2, true);
    const name = getString(view, nameLen, EncUtf16le);
    const description = getString(view, valueLen, EncUtf16le);

    setDescription(descriptions, valueType, name, description);
  }

  return descriptions;
};

/**
 * Read the asf content description from the buffer if it can be read.
 * @param buffer Buffer object for music files containing description
 * @returns content description object on success, undefined on failure
 */
export const wma = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createReaderView(buffer);

  try {
    // ASF Header Object: 75B22630-668E-11CF-A6D9-00AA0062CE6C
    const header = parseAsfObject(view);

    if (!header || header.guid !== "G3026B2758E66CF11A6D900AA0062CE6C") {
      return undefined;
    }

    moveRel(header.data, 6);
    let object;
    let descriptions: Record<string, string> = {};
    while ((object = parseAsfObject(header.data))) {
      const parserObjects: Record<string, (view: ReaderView) => Record<string, string>> = {
        // ASF Content Description Object: 75B22633-668E-11CF-A6D9-00AA0062CE6C
        G3326B2758E66CF11A6D900AA0062CE6C: parseContentDescription,
        // ASF Extended Content Description Object: D2D0A440-E307-11D2-97F0-00A0C95EA850
        G40A4D0D207E3D21197F000A0C95EA850: parseExtendedContentDescription,
        // ASF Header Extension Object: 5FBF03B5-A92E-11CF-8EE3-00C00C205365
        GB503BF5F2EA9CF118EE300C00C205365: parseHeaderExtension,
      };
      descriptions = { ...descriptions, ...parserObjects[object.guid]?.(object.data) };
    }

    return descriptions;
  } catch (error) {
    return undefined;
  }
};
