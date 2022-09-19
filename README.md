# audio-metadata

[![npm version](https://badge.fury.io/js/@mikiymk%2Faudio-metadata.svg)](https://badge.fury.io/js/@mikiymk%2Faudio-metadata)

This is a fork of [audio-metadata](https://github.com/tmont/audio-metadata). Gzipped size: 2.1K -> 1.3KB.

This is a library to extract metadata from audio files.
Specifically, it can extract [ID3v1](http://en.wikipedia.org/wiki/ID3#ID3v1), [ID3v2](http://en.wikipedia.org/wiki/ID3#ID3v2), and [Vorbis comments](http://www.xiph.org/vorbis/doc/v-comment.html) metadata in [OGG containers](http://en.wikipedia.org/wiki/Ogg).

Licensed under the [WTFPL](http://www.wtfpl.net/).

## Usage

The library operates solely on `ArrayBuffer`s, `Uint8Array`s, or `Buffer`s for Node's convenience.
So you'll need to preload your audio data before using this library.

The library defines three methods:

```javascript
// extract comments from OGG container
AudioMetaData.ogg(buffer);

// extract ID3v2 tags
AudioMetaData.id3v2(buffer);

// extract ID3v1 tags
AudioMetaData.id3v1(buffer);
```

The result is an object with the metadata. It attempts to normalize common keys:

- **title**: (`TIT1` and `TIT2` in id3v2)
- **artist**: (`TSE1` in id3v2)
- **composer**: (`TCOM` in id3v2)
- **album**: (`TALB` in id3v2)
- **track**: (`TRCK` in id3v2, commonly `TRACKNUMBER` in vorbis comments)
- **year**: (`TDRC` (date recorded) is used in id3v2)
- **encoder**: (`TSSE` in id3v2)
- **genre**: (`TCON` in id3v2)

Everything else will be keyed by its original name. For id3v2, anything that is not a text identifier (i.e. a frame that starts with a "T") is ignored. This includes comments (`COMM`).

### Node

Install it using NPM:

```sh
npm install audio-metadata
```

```javascript
import * as AudioMetaData from("audio-metadata");
import * as fs from require("fs");

const oggData = fs.readFileSync("/path/to/my.ogg");
const metadata = AudioMetaData.ogg(oggData);

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

### Browser

This library has been tested on current versions of Firefox and Chrome. IE might work, since it apparently supports `ArrayBuffer`. Safari/Opera are probably okayish since they're webkit. Your mileage may vary.

Loading `min/audio-metadata.umd.js` will define the `AudioMetadata` global variable.

```html
<script type="text/javascript" src="audio-metadata.umd.js"></script>
<script type="text/javascript">
  var req = new XMLHttpRequest();
  req.open("GET", "http://example.com/sofine.mp3", true);
  req.responseType = "arraybuffer";

  req.onload = function () {
    var metadata = AudioMetaData.id3v2(req.response);

    // metadata:
    // {
    // 	"TIT2": "Foobar",
    // 	"title": "Foobar",
    // 	"TPE1": "The Foobars",
    // 	"artist": "The Foobars",
    // 	"TALB": "FUBAR",
    // 	"album": "FUBAR",
    // 	"year": "2014",
    // 	"TRCK": "9",
    // 	"track": "9",
    // 	"TSSE": "Lavf53.21.1",
    // 	"encoder": "Lavf53.21.1"
    // }
  };

  req.send(null);
</script>
```

## Development

```bash
git clone git@github.com:mikiymk/audio-metadata
cd audio-metadata
npm install
npm test
```

There's a "test" (yeah, yeah) for browsers, which you can view by running `npm start` and then pointing your browser at [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

To build the minified browserified file, run `npm run minify`.
