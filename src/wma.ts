/**
 * https://learn.microsoft.com/en-us/windows/win32/wmformat/overview-of-the-asf-format
 */

import { createView, readUtf16le } from "./utils";

const getHexString = (view: DataView, offset: number): string => {
  let str = "";
  for (let i = 0; i < 2; i++) {
    str += view
      .getBigUint64(offset + i * 8)
      .toString(16)
      .padStart(16, "0")
      .toUpperCase();
  }

  return str;
};

const parseContentDescription = (view: DataView, offset: number) => {
  const titleLen = view.getUint16(offset, true);
  const authorLen = view.getUint16(offset + 2, true);
  const copyrightLen = view.getUint16(offset + 4, true);
  const descriptionLen = view.getUint16(offset + 6, true);
  const ratingLen = view.getUint16(offset + 8, true);

  return {
    title: readUtf16le(view, (offset += 10), titleLen).replace(/\0$/, ""),
    artist: readUtf16le(view, (offset += titleLen), authorLen).replace(/\0$/, ""),
    copyright: readUtf16le(view, (offset += authorLen), copyrightLen).replace(/\0$/, ""),
    comment: readUtf16le(view, (offset += copyrightLen), descriptionLen).replace(/\0$/, ""),
    rating: readUtf16le(view, (offset += descriptionLen), ratingLen).replace(/\0$/, ""),
  };
};

const DescriptionMap: Record<string, string> = {
  "wm/albumtitle": "album",
};

const parseExtendedContentDescription = (view: DataView, offset: number) => {
  const descriptions: Record<string, string> = {};
  const count = view.getUint16(offset, true);
  offset += 2;

  for (let i = 0; i < count; i++) {
    const nameLen = view.getUint16(offset, true);
    const name = readUtf16le(view, (offset += 2), nameLen)
      .replace(/\0$/, "")
      .toLowerCase();
    const name2 = name.startsWith("wm/") ? name.slice(3) : name;
    const name3 = DescriptionMap[name] || name;
    const valueType = view.getUint16((offset += nameLen), true);
    const valueLen = view.getUint16((offset += 2), true);

    switch (valueType) {
      case 0:
        descriptions[name2] = descriptions[name3] = readUtf16le(view, (offset += 2), valueLen).replace(/\0$/, "");
        break;

      default:
    }

    offset += valueLen;
  }

  return descriptions;
};

const parseHeaderExtension = (view: DataView, offset: number) => {
  const dataSize = view.getUint32(offset + 18);

  const descriptions: Record<string, string> = {};
  offset += 22;

  for (; offset < dataSize; ) {
    switch (getHexString(view, offset)) {
      case "EACBF8C5AF5B48778467AA8C44FA4CCA":
      case "941C23449894D149A1411D134E457054":
        // ASF Metadata Object: C5F8CBEA-5BAF-4877-8467-AA8C44FA4CCA
        // ASF Metadata Library Object: 44231C94-9498-49D1-A141-1D134E457054
        Object.assign(descriptions, parseMetadata(view, offset + 24));
        break;

      default:
    }

    offset += Number(view.getBigUint64(offset + 16, true));
  }

  return descriptions;
};

const parseMetadata = (view: DataView, offset: number) => {
  const descriptions: Record<string, string> = {};
  const count = view.getUint16(offset, true);
  offset += 2;

  for (let i = 0; i < count; i++) {
    offset += 4; // reserved and stream number
    const nameLen = view.getUint16(offset, true);
    const valueType = view.getUint16((offset += 2), true);
    const valueLen = view.getUint16((offset += 2), true);

    const name = readUtf16le(view, (offset += 2), nameLen)
      .replace(/\0$/, "")
      .toLowerCase();
    const name2 = name.startsWith("wm/") ? name.slice(3) : name;
    const name3 = DescriptionMap[name] || name;

    switch (valueType) {
      case 0:
        descriptions[name2] = descriptions[name3] = readUtf16le(view, (offset += nameLen), valueLen).replace(/\0$/, "");
        break;

      default:
    }

    offset += valueLen;
  }

  return descriptions;
};

/**
 * Read the asf content description from the buffer if it can be read.
 * @param buffer Buffer object for music files containing description
 * @returns content description object on success, undefined on failure
 */
export const wma = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createView(buffer);

  // ASF Header Object: 75B22630-668E-11CF-A6D9-00AA0062CE6C
  if (getHexString(view, 0) !== "3026B2758E66CF11A6D900AA0062CE6C") {
    return undefined;
  }

  try {
    const headerSize = view.getBigUint64(16, true);
    const descriptions: Record<string, string> = {};
    let offset = 30;

    for (; offset < headerSize; ) {
      switch (getHexString(view, offset)) {
        case "3326B2758E66CF11A6D900AA0062CE6C":
          // ASF Content Description Object: 75B22633-668E-11CF-A6D9-00AA0062CE6C
          Object.assign(descriptions, parseContentDescription(view, offset + 24));
          break;

        case "40A4D0D207E3D21197F000A0C95EA850":
          // ASF Extended Content Description Object: D2D0A440-E307-11D2-97F0-00A0C95EA850
          Object.assign(descriptions, parseExtendedContentDescription(view, offset + 24));
          break;

        case "B503BF5F2EA9CF118EE300C00C205365":
          // ASF Header Extension Object: 5FBF03B5-A92E-11CF-8EE3-00C00C205365
          Object.assign(descriptions, parseHeaderExtension(view, offset + 24));
          break;

        default:
      }

      offset += Number(view.getBigUint64(offset + 16, true));
    }

    // ASF Metadata Object: C5F8CBEA-5BAF-4877-8467-AA8C44FA4CCA
    // ASF Metadata Library Object: 44231C94-9498-49D1-A141-1D134E457054

    return descriptions;
  } catch (error) {
    return undefined;
  }
};