import { id3v2 } from "./id3v2";
import { createReaderView, EncAscii, getString, getUint, getView, moveRel, ReaderView } from "./reader";

interface IffChunk {
  id: string;
  size: number;
  data: ReaderView;
}

/**
 * read AIFF chunk
 *
 * | size    | tag         |
 * | ------- | ----------- |
 * | 4 bytes | chunk ID    |
 * | 4 bytes | chunk size  |
 * | n bytes | chunk data  |
 *
 * @param view ReaderView contains AIFF chunk
 * @returns AIFF chunk object on success, undefined on failure
 */
const parseChunk = (view: ReaderView): IffChunk | undefined => {
  try {
    const id = getString(view, 4, EncAscii);
    const size = getUint(view, 4);
    const data = getView(view, size);
    if (size % 2) moveRel(view, 1); // zero padding

    return { id, size, data };
  } catch {
    return undefined;
  }
};

/**
 * Read the ID3v2 tag from aiff file if it can be read.
 * @param buffer Buffer object for music files containing ID3v2 tags in aiff
 * @returns ID3v2 object on success, undefined on failure
 */
export const aiff = (buffer: Uint8Array | ArrayBufferLike): Record<string, string> | undefined => {
  const view = createReaderView(buffer);

  const form = parseChunk(view);
  if (!form || form.id !== "FORM") {
    return undefined;
  }

  const formType = getString(form.data, 4, EncAscii);

  if (formType !== "AIFF" && formType !== "AIFC") {
    return undefined;
  }

  let chunk;
  while ((chunk = parseChunk(form.data))) {
    if (chunk.id === "ID3 ") {
      return id3v2(chunk.data[0]);
    }
  }

  return undefined;
};
