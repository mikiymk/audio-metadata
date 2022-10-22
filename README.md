# audio-metadata

[![npm version](https://badge.fury.io/js/@mikiymk%2Faudio-metadata.svg)](https://badge.fury.io/js/@mikiymk%2Faudio-metadata)

This is a fork of [tmont/audio-metadata](https://github.com/tmont/audio-metadata).

This is a library to extract metadata from audio files.
Specifically, it can extract following metadata:

- [ID3v1](http://en.wikipedia.org/wiki/ID3#ID3v1) (mp3)
- [ID3v2](http://en.wikipedia.org/wiki/ID3#ID3v2) (mp3, ape, aiff, wav)
  only frame ID starts with 'T'
- [Vorbis Comment](https://en.wikipedia.org/wiki/Vorbis_comment) (ogg, flac)
- [APEv2](https://en.wikipedia.org/wiki/APE_tag) (mp3, ape)
- [MP4](https://en.wikipedia.org/wiki/MP4_file_format) meta box (mp4)
- [RIFF](https://en.wikipedia.org/wiki/Resource_Interchange_File_Format) info list (wav, riff)
- [ASF](https://en.wikipedia.org/wiki/Advanced_Systems_Format) description (wma, asf)

Licensed under the [WTFPL](http://www.wtfpl.net/).

# Install

Run this command to install the library with NPM.

```sh
npm install audio-metadata
```

```javascript
import { ogg } from("@mikiymk/audio-metadata");
import { readFile } from require("fs/promise");

const oggData = await readFile("/path/to/my.ogg");
const metadata = ogg(oggData);

// metadata:
// {
//   "title": "Contra Base Snippet",
//   "artist": "Konami",
//   "album": "Bill and Lance's Excellent Adventure",
//   "year": "1988",
//   "tracknumber": "1",
//   "track": "1",
//   "encoder": "Lavf53.21.1"
// }
```

# Usage

This library defines functions that receive an `ArrayBuffer` or a View as an argument and return an object.
So you'll need to preload your audio data before using this library.

```javascript
import { ogg } from "@mikiymk/audio-metadata";

// extract comments from OGG container
const metadata = ogg(buffer);

import { id3v2 } from "@mikiymk/audio-metadata";

// extract ID3v2 tags
const metadata = id3v2(buffer);

import { id3v1 } from "@mikiymk/audio-metadata";

// extract ID3v1 tags
const metadata = id3v1(buffer);

import { flac } from "@mikiymk/audio-metadata";

// extract flac tags
const metadata = flac(buffer);

import { wma } from "@mikiymk/audio-metadata";

// extract wma tags
const metadata = wma(buffer);

import { mp4 } from "@mikiymk/audio-metadata";

// extract mp4 tags
const metadata = mp4(buffer);

import { apev2 } from "@mikiymk/audio-metadata";

// extract APEv2 tags
const metadata = apev2(buffer);

import { aiff } from "@mikiymk/audio-metadata";

// extract AIFF tags
const metadata = aiff(buffer);

import { wav } from "@mikiymk/audio-metadata";

// extract wav tags
const metadata = wav(buffer);
```

The result is a key-value object with metadata.
The following keys are normalized to common keys:

| common tag      | ID3v1 | ID3v2.2      | ID3v2.3, ID3v2.4               | Vorbis Comment | APEv2          | MP4            | RIFF           | ASF           |
| --------------- | :---: | ------------ | ------------------------------ | -------------- | -------------- | -------------- | -------------- | ------------- |
| **title**       |  〇   | `TT1`, `TT2` | `TIT1`, `TIT2`                 |                |                | `©nam`         | `INAM`         |               |
| **album**       |  〇   | `TAL`        | `TALB`                         |                |                | `©alb`         | `IPRD`         | `albumtitle`  |
| **artist**      |  〇   | `TP1`        | `TPE1`                         |                |                | `©ART`         | `IART`         |               |
| **albumartist** |       | `TP2`        | `TPE2`                         |                | `album artist` | `aART`         |                |               |
| **composer**    |       | `TCM`        | `TCOM`                         |                |                | `©wrt`, `©com` | `IMUS`         |               |
| **track**       |  〇   | `TRK`        | `TRCK`                         | `tracknumber`  |                | `trkn`         | `IPRT`, `ITRK` | `tracknumber` |
| **disc**        |       | `TPS`        | `TPOS`                         |                |                | `disk`         |                | `partofset`   |
| **year**        |  〇   | `TYE`        | `TYER`, `TDRC` (date recorded) |                |                | `©day`         |                |               |
| **encoder**     |       | `TSS`        | `TSSE`                         |                |                | `©too`         | `ISFT`         | `toolname`    |
| **genre**       |  〇   | `TCO`        | `TCON`                         |                |                | `©gen`, `gnre` | `IGNR`         |               |
| **comment**     |  〇   | `COM`        | `COMM`                         |                |                | `©cmt`         | `ICMT`         | `comments`    |

# Development

```bash
git clone git@github.com:mikiymk/audio-metadata
cd audio-metadata
npm install
npm test
```

There's a "test" (yeah, yeah) for browsers, which you can view by running `npm start` and then pointing your browser at [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

To build the minified browserified file, run `npm run minify`.
