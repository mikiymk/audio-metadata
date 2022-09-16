import * as metaDataReader from "../";
import * as should from "should";
import * as path from "path";
import * as fs from "fs";
import { describe, it } from "vitest";

describe("ogg", function () {
  it("should read comments from ogg", function (done: (
    arg0: undefined
  ) => void) {
    const file = path.join(__dirname, "files", "test.ogg");
    fs.readFile(file, function (err: any, buffer: any) {
      if (err) {
        done(err);
        return;
      }

      const metadata = metaDataReader.ogg(buffer);
      should.exist(metadata);
      metadata.should.have.property("title", "Contra Base Snippet");
      metadata.should.have.property("artist", "Konami");
      metadata.should.have.property(
        "album",
        "Bill and Lance's Excellent Adventure"
      );
      metadata.should.have.property("year", "1988");
      metadata.should.have.property("encoder", "Lavf53.21.1");
      metadata.should.have.property("track", "1");
      metadata.should.have.property("tracknumber", "1");
      done();
    });
  });

  it("should read comments from truncated ogg", function (done: (
    arg0: undefined
  ) => void) {
    const file = path.join(__dirname, "files", "truncated.ogg");
    fs.readFile(file, function (err: any, buffer: any) {
      if (err) {
        done(err);
        return;
      }

      const metadata = metaDataReader.ogg(buffer);
      should.exist(metadata);
      metadata.should.have.property("title", "Contra Base Snippet");
      metadata.should.have.property("artist", "Konami");
      metadata.should.have.property(
        "album",
        "Bill and Lance's Excellent Adventure"
      );
      metadata.should.have.property("year", "1988");
      metadata.should.have.property("encoder", "Lavf53.21.1");
      metadata.should.have.property("track", "1");
      done();
    });
  });

  it("should not explode if ogg comments don't exist", function (done: () => void) {
    const buffer = new Buffer(30);
    const metadata = metaDataReader.ogg(buffer);
    should.deepEqual(metadata, null);
    done();
  });
});

describe("id3", function () {
  it("should read id3v2.4.0", function (done: (arg0: undefined) => void) {
    const file = path.join(__dirname, "files", "id3v2.4.mp3");
    fs.readFile(file, function (err: any, buffer: any) {
      if (err) {
        done(err);
        return;
      }

      const metadata = metaDataReader.id3v2(buffer);
      should.exist(metadata);
      metadata.should.have.property("title", "Contra");
      metadata.should.have.property("artist", "Bill & Ted");
      metadata.should.have.property("album", "Konami");
      metadata.should.have.property("year", "2006");
      metadata.should.have.property("encoder", "Lavf53.21.1");
      metadata.should.have.property("track", "2");
      metadata.should.have.property("genre", "Tango");
      metadata.should.have.property("TCON", "Tango");
      done();
    });
  });

  it("should read messed up id3v2.4.0", function (done: (
    arg0: undefined
  ) => void) {
    const file = path.join(__dirname, "files", "id3v2.4_wtf.mp3");
    fs.readFile(file, function (err: any, buffer: any) {
      if (err) {
        done(err);
        return;
      }

      const metadata = metaDataReader.id3v2(buffer);
      should.exist(metadata);
      metadata.should.have.property("title", "The Four Orbs");
      metadata.should.have.property("artist", "Tommy Montgomery");
      metadata.should.have.property("album", "Motif");
      metadata.should.have.property("year", "2004");
      metadata.should.have.property("track", "2");
      metadata.should.have.property("TRCK", "2");
      metadata.should.have.property("TDRC", "2004");
      metadata.should.have.property("TIT2", "The Four Orbs");
      metadata.should.have.property("TALB", "Motif");
      metadata.should.have.property("TPE1", "Tommy Montgomery");
      done();
    });
  });

  it("should read truncated id3v2.4.0", function (done: (
    arg0: undefined
  ) => void) {
    const file = path.join(__dirname, "files", "truncated.mp3");
    fs.readFile(file, function (err: any, buffer: any) {
      if (err) {
        done(err);
        return;
      }

      const metadata = metaDataReader.id3v2(buffer);
      should.exist(metadata);
      metadata.should.have.property("title", "Contra");
      metadata.should.have.property("artist", "Bill & Ted");
      metadata.should.have.property("album", "Konami");
      metadata.should.have.property("year", "2000");
      metadata.should.have.property("encoder", "Lavf53.21.1");
      metadata.should.have.property("track", "2");
      done();
    });
  });

  it("should read id3v2.3.0", function (done: (arg0: undefined) => void) {
    const file = path.join(__dirname, "files", "id3v2.3.mp3");
    fs.readFile(file, function (err: any, buffer: any) {
      if (err) {
        done(err);
        return;
      }

      const metadata = metaDataReader.id3v2(buffer);
      should.exist(metadata);
      metadata.should.have.property("title", "Foobar");
      metadata.should.have.property("artist", "The Foobars");
      metadata.should.have.property("album", "FUBAR");
      metadata.should.have.property("year", "2014");
      metadata.should.have.property("encoder", "Lavf53.21.1");
      metadata.should.have.property("track", "9");
      done();
    });
  });

  it("should read id3v1", function (done: (arg0: undefined) => void) {
    const file = path.join(__dirname, "files", "id3v1.mp3");
    fs.readFile(file, function (err: any, buffer: any) {
      if (err) {
        done(err);
        return;
      }

      const metadata = metaDataReader.id3v1(buffer);
      should.exist(metadata);
      metadata.should.have.property("title", "Foobar");
      metadata.should.have.property("artist", "The Foobars");
      metadata.should.have.property("album", "FUBAR");
      metadata.should.have.property("year", "2014");
      metadata.should.have.property("track", 9);
      metadata.should.have.property("genre", 255);
      metadata.should.have.property("comment", "oh hai mark");
      done();
    });
  });

  it("should read id3v1 with 30-byte comment and no track", function (done: (
    arg0: undefined
  ) => void) {
    const file = path.join(__dirname, "files", "id3v1_notrack.mp3");
    fs.readFile(file, function (err: any, buffer: any) {
      if (err) {
        done(err);
        return;
      }

      const metadata = metaDataReader.id3v1(buffer);
      should.exist(metadata);
      metadata.should.have.property("title", "Foobar");
      metadata.should.have.property("artist", "The Foobars");
      metadata.should.have.property("album", "FUBAR");
      metadata.should.have.property("year", "2014");
      metadata.should.have.property("track", null);
      metadata.should.have.property("genre", 255);
      metadata.should.have.property(
        "comment",
        "this should be exactly 30 char"
      );
      done();
    });
  });

  it("should not explode if ID3v1 tags don't exist", function (done: () => void) {
    const buffer = new Buffer(1);
    const metadata = metaDataReader.id3v1(buffer);
    should.deepEqual(metadata, null);
    done();
  });

  it("should not explode if ID3v2 tags don't exist", function (done: () => void) {
    const buffer = new Buffer(1);
    const metadata = metaDataReader.id3v2(buffer);
    should.deepEqual(metadata, null);
    done();
  });
});
