'use strict';

const fs = require('fs');
const path = require('path');

const { parse } = require('../lib/parser');

const filename = process.argv[2];
const wixFilename = process.argv[3] || null;

const basename = path.basename(filename).replace(/\..*$/, '');

(async () => {
  const wil = await parse(filename, wixFilename);
  console.log(`* ${basename}:`);
  console.log(`  Color Count -> ${wil.colorCount}`);
  console.log(`  Count -> ${wil.count()}`);

  fs.mkdirSync(path.join(__dirname, basename), { recursive: true });
  for (let i = 0; i < wil.count(); i++) {
    const bitmap = await wil.getBitmap(i);
    await fs.promises.writeFile(
      path.join(__dirname, basename, `${i}.bmp`), await bitmap.dumpBmp());
    const png = await bitmap.dumpPng();
    await fs.promises.writeFile(
      path.join(__dirname, basename, `${i}.png`), png);
    console.log(`  ${i} -> ${bitmap.width}x${bitmap.height}`);
  }

  console.log('Done.');
})();
