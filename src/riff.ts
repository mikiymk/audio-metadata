import { id3v2 } from "./id3v2";
import { createReaderView, EncAscii, EncUtf8, getString, getUint, getView, moveRel, ReaderView } from "./reader";
import { CommonKeys, mapTag } from "./tagmap";
import { trimNull } from "./utils";

interface IffChunk {
  id: string;
  size: number;
  data: ReaderView;
}

/**
 * read RIFF chunk
 *
 * | size    | tag         |
 * | ------- | ----------- |
 * | 4 bytes | chunk ID    |
 * | 4 bytes | chunk size  |
 * | n bytes | chunk data  |
 *
 * @param view ReaderView contains RIFF chunk
 * @returns RIFF chunk object on success, undefined on failure
 */
const parseChunk = (view: ReaderView): IffChunk | undefined => {
  try {
    const id = getString(view, 4, EncAscii);
    const size = getUint(view, 4, true);
    const data = getView(view, size);
    if (size % 2) moveRel(view, 1); // zero padding

    return { id, size, data };
  } catch {
    return undefined;
  }
};

const InfoMap: Record<string, CommonKeys> = {
  INAM: "title",
  IPRD: "album",
  IART: "artist",
  IMUS: "composer",
  IPRT: "track",
  ITRK: "track",
  IFRM: "totaltracks",
  ISFT: "encoder",
  IGNR: "genre",
  ICMT: "comment",
};

/**
 * read RIFF LIST chunk data, all children is metadata
 * @param view ReaderView contains RIFF chunk
 * @returns RIFF chunk object on success, undefined on failure
 */
const parseListInfo = (view: ReaderView): Record<string, string> | undefined => {
  const infos: Record<string, string> = {};
  let chunk;
  while ((chunk = parseChunk(view))) {
    mapTag(infos, InfoMap, chunk.id, trimNull(getString(chunk.data, chunk.size, EncUtf8)));
  }

  return infos;
};

/**
 * read RIFF LIST chunk data
 * @param view ReaderView contains RIFF chunk
 * @returns RIFF chunk object on success, undefined on failure
 */
const parseRiff = (view: ReaderView): Record<string, string> | undefined => {
  let chunk;
  let infos: Record<string, string> = {};
  while ((chunk = parseChunk(view))) {
    switch (chunk.id) {
      case "id3 ":
        infos = { ...infos, ...id3v2(chunk.data[0]) };
        break;

      case "LIST":
        if (getString(chunk.data, 4, EncAscii) === "INFO") {
          infos = { ...infos, ...parseListInfo(chunk.data) };
        } else {
          infos = { ...infos, ...parseRiff(chunk.data) };
        }
        break;
    }
  }

  return infos;
};

/**
 * Read the ID3v2 tag from aiff file if it can be read.
 * @param buffer Buffer object for music files containing ID3v2 tags in aiff
 * @returns ID3v2 object on success, undefined on failure
 */
export const wav = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createReaderView(buffer);

  const form = parseChunk(view);
  if (!form || form.id !== "RIFF") {
    return undefined;
  }

  if (getString(form.data, 4, EncAscii) !== "WAVE") {
    return undefined;
  }

  return parseRiff(form.data);
};
