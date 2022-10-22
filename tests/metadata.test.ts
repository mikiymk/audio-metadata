import { ogg, id3v2, id3v1, flac, wma, mp4, apev2, aiff, wav } from "../src";
import { join } from "path";
import { readFile } from "fs/promises";
import { describe, expect, it } from "vitest";

const filePath = (fileName: string) => join(__dirname, "files", fileName);

describe("ogg", () => {
  it("should read comments from ogg", async () => {
    const file = filePath("test.ogg");
    const buffer = await readFile(file);

    const metadata = ogg(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "Contra Base Snippet");
    expect(metadata).toHaveProperty("title", "Contra Base Snippet");
    expect(metadata).toHaveProperty("artist", "Konami");
    expect(metadata).toHaveProperty("album", "Bill and Lance's Excellent Adventure");
    expect(metadata).toHaveProperty("year", "1988");
    expect(metadata).toHaveProperty("encoder", "Lavf53.21.1");
    expect(metadata).toHaveProperty("track", "1");
    expect(metadata).toHaveProperty("tracknumber", "1");
  });

  it("should read comments from truncated ogg", async () => {
    const file = filePath("truncated.ogg");
    const buffer = await readFile(file);

    const metadata = ogg(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "Contra Base Snippet");
    expect(metadata).toHaveProperty("artist", "Konami");
    expect(metadata).toHaveProperty("album", "Bill and Lance's Excellent Adventure");
    expect(metadata).toHaveProperty("year", "1988");
    expect(metadata).toHaveProperty("encoder", "Lavf53.21.1");
    expect(metadata).toHaveProperty("track", "1");
  });

  it("should not explode if ogg comments don't exist", async () => {
    const buffer = Buffer.alloc(30);
    const metadata = ogg(buffer);
    expect(metadata).toBeUndefined();
  });
});

describe("id3", () => {
  it("should read id3v2.4.0", async () => {
    const file = filePath("id3v2.4.mp3");
    const buffer = await readFile(file);

    const metadata = id3v2(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "Contra");
    expect(metadata).toHaveProperty("artist", "Bill & Ted");
    expect(metadata).toHaveProperty("album", "Konami");
    expect(metadata).toHaveProperty("year", "2006");
    expect(metadata).toHaveProperty("encoder", "Lavf53.21.1");
    expect(metadata).toHaveProperty("track", "2");
    expect(metadata).toHaveProperty("genre", "Tango");
    expect(metadata).toHaveProperty("TCON", "Tango");
  });

  it("should read messed up id3v2.4.0", async () => {
    const file = filePath("id3v2.4_wtf.mp3");
    const buffer = await readFile(file);

    const metadata = id3v2(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "The Four Orbs");
    expect(metadata).toHaveProperty("artist", "Tommy Montgomery");
    expect(metadata).toHaveProperty("album", "Motif");
    expect(metadata).toHaveProperty("year", "2004");
    expect(metadata).toHaveProperty("track", "2");
    expect(metadata).toHaveProperty("TRCK", "2");
    expect(metadata).toHaveProperty("TDRC", "2004");
    expect(metadata).toHaveProperty("TIT2", "The Four Orbs");
    expect(metadata).toHaveProperty("TALB", "Motif");
    expect(metadata).toHaveProperty("TPE1", "Tommy Montgomery");
  });

  it("should read truncated id3v2.4.0", async () => {
    const file = filePath("truncated.mp3");
    const buffer = await readFile(file);

    const metadata = id3v2(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "Contra");
    expect(metadata).toHaveProperty("artist", "Bill & Ted");
    expect(metadata).toHaveProperty("album", "Konami");
    expect(metadata).toHaveProperty("year", "2000");
    expect(metadata).toHaveProperty("encoder", "Lavf53.21.1");
    expect(metadata).toHaveProperty("track", "2");
  });

  it("should read id3v2.3.0", async () => {
    const file = filePath("id3v2.3.mp3");
    const buffer = await readFile(file);

    const metadata = id3v2(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "Foobar");
    expect(metadata).toHaveProperty("artist", "The Foobars");
    expect(metadata).toHaveProperty("album", "FUBAR");
    expect(metadata).toHaveProperty("year", "2014");
    expect(metadata).toHaveProperty("encoder", "Lavf53.21.1");
    expect(metadata).toHaveProperty("track", "9");
  });

  it("should read id3v1", async () => {
    const file = filePath("id3v1.mp3");
    const buffer = await readFile(file);

    const metadata = id3v1(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "Foobar");
    expect(metadata).toHaveProperty("artist", "The Foobars");
    expect(metadata).toHaveProperty("album", "FUBAR");
    expect(metadata).toHaveProperty("year", "2014");
    expect(metadata).toHaveProperty("track", 9);
    expect(metadata).toHaveProperty("genre", 255);
    expect(metadata).toHaveProperty("comment", "oh hai mark");
  });

  it("should read id3v1 with 30-byte comment and no track", async () => {
    const file = filePath("id3v1_notrack.mp3");
    const buffer = await readFile(file);

    const metadata = id3v1(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "Foobar");
    expect(metadata).toHaveProperty("artist", "The Foobars");
    expect(metadata).toHaveProperty("album", "FUBAR");
    expect(metadata).toHaveProperty("year", "2014");
    expect(metadata).toHaveProperty("track", undefined);
    expect(metadata).toHaveProperty("genre", 255);
    expect(metadata).toHaveProperty("comment", "this should be exactly 30 char");
  });

  it("should not explode if ID3v1 tags don't exist", () => {
    const buffer = Buffer.alloc(1);
    const metadata = id3v1(buffer);
    expect(metadata).toBeUndefined();
  });

  it("should not explode if ID3v2 tags don't exist", () => {
    const buffer = Buffer.alloc(1);
    const metadata = id3v2(buffer);
    expect(metadata).toBeUndefined();
  });
});

describe("flac", () => {
  it("should read comments from flac", async () => {
    const file = filePath("flac.flac");
    const buffer = await readFile(file);

    const metadata = flac(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "Common blackbird singing denoised");
    expect(metadata).toHaveProperty("artist", "common blackbird");
    expect(metadata).toHaveProperty("album", "Wikimedia Commons");
    expect(metadata).toHaveProperty("genre", "birdsing");
    expect(metadata).toHaveProperty("comment", "CC0");
    expect(metadata).toHaveProperty("date", "7 May 2013");
    expect(metadata).toHaveProperty("tracknumber", "1");
  });

  it("should not explode if flac comments don't exist", async () => {
    const buffer = Buffer.alloc(30);
    const metadata = flac(buffer);
    expect(metadata).toBeUndefined();
  });
});

describe("wma", () => {
  it("should read descriptions from wma", async () => {
    const file = filePath("wma.wma");
    const buffer = await readFile(file);

    const metadata = wma(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "sample1 wma");
    expect(metadata).toHaveProperty("artist", "some artist");
    expect(metadata).toHaveProperty("album", "any album");
    expect(metadata).toHaveProperty("albumartist", "no album artist");
    expect(metadata).toHaveProperty("composer", "it's composer");
    expect(metadata).toHaveProperty("genre", "more genre");
    expect(metadata).toHaveProperty("comment", "various comment");
    expect(metadata).toHaveProperty("year", "1900");
    expect(metadata).toHaveProperty("tracknumber", "10");
    expect(metadata).toHaveProperty("track", "9");
  });

  it("should not explode if wma descriptions don't exist", async () => {
    const buffer = Buffer.alloc(30);
    const metadata = wma(buffer);
    expect(metadata).toBeUndefined();
  });
});

describe("mp4", () => {
  it("should read descriptions from mp4", async () => {
    const file = filePath("mp4.mp4");
    const buffer = await readFile(file);

    const metadata = mp4(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "Symphony No.6 (1st movement)");
    expect(metadata).toHaveProperty("artist", "Ludwig van Beethoven");
    expect(metadata).toHaveProperty("album", "www.mfiles.co.uk");
    expect(metadata).toHaveProperty("encoder", "Lavf57.83.100");
    expect(metadata).toHaveProperty("genre", "Classical");
    expect(metadata).toHaveProperty("comment", "\ufffd Music Files Ltd");
  });

  it("should not explode if mp4 descriptions don't exist", async () => {
    const buffer = Buffer.alloc(30);
    const metadata = mp4(buffer);
    expect(metadata).toBeUndefined();
  });
});

describe("apev2", () => {
  it("should read tags from apev2", async () => {
    const file = filePath("apev2.mp3");
    const buffer = await readFile(file);

    const metadata = apev2(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "sample s3");
    expect(metadata).toHaveProperty("artist", "unknown");
    expect(metadata).toHaveProperty("album", "album");
  });

  it("should not explode if apev2 tags don't exist", async () => {
    const buffer = Buffer.alloc(30);
    const metadata = apev2(buffer);
    expect(metadata).toBeUndefined();
  });
});

describe("aiff", () => {
  it("should read tags from aiff", async () => {
    const file = filePath("aiff.aiff");
    const buffer = await readFile(file);

    const metadata = aiff(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "aiff stereo");
    expect(metadata).toHaveProperty("artist", "unknown");
    expect(metadata).toHaveProperty("album", "aiff");
  });

  it("should read tags from aiff-c", async () => {
    const file = filePath("aifc.aiff");
    const buffer = await readFile(file);

    const metadata = aiff(buffer);

    expect(metadata).toBeTruthy();

    expect(metadata).toHaveProperty("title", "aiff-c stereo");
    expect(metadata).toHaveProperty("artist", "unknown");
    expect(metadata).toHaveProperty("album", "aiff-c");
  });

  it("should not explode if aiff tags don't exist", async () => {
    const buffer = Buffer.alloc(30);
    const metadata = aiff(buffer);
    expect(metadata).toBeUndefined();
  });
});

describe("wav", () => {
  it("should read tags from wav", async () => {
    const file = filePath("riff.wav");
    const buffer = await readFile(file);

    const metadata = wav(buffer);

    expect(metadata).toBeTruthy();
    expect(metadata).toHaveProperty("title", "wav riff");
    expect(metadata).toHaveProperty("artist", "unknown");
    expect(metadata).toHaveProperty("album", "wav");
  });

  it("should not explode if wav tags don't exist", async () => {
    const buffer = Buffer.alloc(30);
    const metadata = wav(buffer);
    expect(metadata).toBeUndefined();
  });
});
