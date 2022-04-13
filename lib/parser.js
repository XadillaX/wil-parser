'use strict';

const fs = require('fs').promises;
const { existsSync } = require('fs');
const path = require('path');

const Base = require('sdk-base');
const { parse: parseWix } = require('wix-parser');

const { Bitmap } = require('./bitmap');

class Wil extends Base {
  constructor(filename, wixFilename = null) {
    super({ initMethod: '_init' });
    this.filename = filename;
    this.wixFilename = wixFilename;

    /**
     * @type {fs.FileHandle | null}
     */
    this.fd = null;
  }

  async _init() {
    if (!this.wixFilename) {
      const temp = this.filename.replace(/\.wil$/, '.wix');
      if (existsSync(temp)) {
        this.wixFilename = temp;
      } else {
        const filenames = await fs.readdir(path.dirname(this.filename));
        const shouldBe = temp.toLowerCase();
        for (const filename of filenames) {
          if (filename.toLowerCase() === shouldBe) {
            this.wixFilename = path.join(path.dirname(this.filename), filename);
            break;
          }
        }
      }

      if (!this.wixFilename) {
        throw new Error(`Could not find wix file for ${this.filename}`);
      }
    }

    ([ this.fd, this.wix ] = await Promise.all([
      fs.open(this.filename, 'r'),
      parseWix(this.wixFilename),
    ]));

    const wilFileImageInfos = this.wilFileImageInfos = [];
    const titleBuff = Buffer.alloc(40);
    const ret = await this.fd.read(titleBuff, 0, titleBuff.length, 0);
    if (ret.bytesRead !== titleBuff.length) {
      throw new Error('read title failed');
    }
    this.title = titleBuff.toString('ascii').replace(/\0.*$/g, '');

    const countBuff = Buffer.alloc(4);

    // Count
    {
      const ret = await this.fd.read(countBuff, 0, 4, 44);
      if (ret.bytesRead !== 4) {
        throw new Error('read count failed');
      }
      const count = countBuff.readUInt32LE(0);
      if (count !== this.wix.wilPositions.length) {
        throw new Error('count mismatch');
      }
    }

    // Color count
    {
      const ret = await this.fd.read(countBuff, 0, 4, 48);
      if (ret.bytesRead !== 4) {
        throw new Error('read color count failed');
      }
      this.colorCount = countBuff.readUInt32LE(0);
    }

    // Palette size
    {
      const ret = await this.fd.read(countBuff, 0, 4, 52);
      if (ret.bytesRead !== 4) {
        throw new Error('read palette size failed');
      }
      this.paletteSize = countBuff.readUInt32LE(0);
    }

    // Palette
    {
      const palette = Buffer.alloc(this.paletteSize);
      const ret = await this.fd.read(palette, 0, palette.length, 56);
      if (ret.bytesRead !== palette.length) {
        throw new Error('read palette failed');
      }
      this.palette = palette;
    }

    const infoBuff = Buffer.alloc(8);
    for (const position of this.wix.wilPositions) {
      const ret = await this.fd.read(infoBuff, 0, 8, position);
      if (ret.bytesRead !== 8) {
        throw new Error('read info failed');
      }
      const width = infoBuff.readUInt16LE(0);
      const height = infoBuff.readUInt16LE(2);
      const px = infoBuff.readUInt16LE(4);
      const py = infoBuff.readUInt16LE(6);
      wilFileImageInfos.push({ width, height, px, py });
    }

    const stats = await fs.stat(this.filename);
    this.fileSize = stats.size;
  }

  count() {
    return this.wilFileImageInfos.length;
  }

  async getBitmap(idx) {
    if (idx >= this.wilFileImageInfos.length) {
      throw new Error(`Invalid image index ${idx}`);
    }

    const position = this.wix.wilPositions[idx];
    const imageInfo = this.wilFileImageInfos[idx];
    const reserved = 8;

    const bufferSize = imageInfo.width * imageInfo.height;
    const buffer = Buffer.alloc(bufferSize);
    const ret = await this.fd.read(
      buffer,
      0,
      buffer.length,
      position + reserved);

    if (ret.bytesRead !== buffer.length) {
      throw new Error('read image failed');
    }

    return new Bitmap(
      imageInfo.width, imageInfo.height, buffer, this.colorCount, this.palette);
  }

  async destroy() {
    if (this.fd) {
      const fd = this.fd;
      this.fd = null;
      await fd.close();
    }
  }
}

async function parse(filename, wixFilename) {
  const wil = new Wil(filename, wixFilename);
  await wil.ready();
  return wil;
}

module.exports = {
  parse,
  Wil,
};
