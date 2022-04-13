# Wil Parser

Parser for *.wil (Legacy version of "Legend of Mir2", with *.wix) files.

## Installation

```shell
$ npm install --save wil-parser
```

## Usage

```js
const { parse } = require('wil-parser');

const wil = await parse('ChrSel.wil');

for (let i = 0; i < wil.count(); i++) {
  const bitmap = await wil.getBitmap(i);

  const bmp = await bitmap.dumpBmp(); // Buffer of a *.bmp
  const png = await bitmap.dumpPng(); // Buffer of a *.png
  const jpg = await bitmap.dumpJpeg(); // Buffer of a *.jpg
}
```

## Contribution

PRs and issues are welcomed.
