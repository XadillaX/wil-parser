'use strict';

let jimp = require('jimp');
const structFu = require('struct-fu');

if (jimp.default) {
  jimp = jimp.default;
}

// https://github.com/vonderheide/mono-bitmap/blob/master/lib/BMPBitmap.js
const BitmapFileHeader = structFu.struct([
  structFu.uint16le('signature'),
  structFu.uint32le('fileSize'),
  structFu.uint32le('reserved'),
  structFu.uint32le('dataOffset'),
  structFu.uint32le('bitmapInfoHeaderSize'),
  structFu.int32le('width'),
  structFu.int32le('height'),
  structFu.uint16le('planes'),
  structFu.uint16le('bitsPerPixel'),
  structFu.uint32le('compression'),
  structFu.uint32le('numberOfDataBytes'),
  structFu.int32le('pixelsPerMeterX'),
  structFu.int32le('pixelsPerMeterY'),
  structFu.uint32le('numberOfUsedColors'),
  structFu.uint32le('numberOfImportantColors'),
]);

const BITMAP_FILE_SIGNATURE = Buffer.from('BM').readUInt16LE(0);
// before 'bitmapInfoHeaderSize'
const SIZE_OF_FIRST_PART_OF_BITMAP_FILE_HEADER = (16 + 32 + 32 + 32) / 8;

class Bitmap {
  constructor(width, height, data, colorCount, palette) {
    this.width = width;
    this.height = height;
    this.data = data;
    this.palette = palette;
    this.colorCount = colorCount;
  }

  async dumpBmp() {
    const header = {
      signature: BITMAP_FILE_SIGNATURE,
      fileSize: null, // later
      reserved: 0,
      dataOffset: BitmapFileHeader.size + this.palette.length,
      bitmapInfoHeaderSize: BitmapFileHeader.size -
        SIZE_OF_FIRST_PART_OF_BITMAP_FILE_HEADER,
      width: this.width,
      height: this.height,
      planes: 1,
      // TODO(XadillaX): support other bit depths (from colorCount)
      bitsPerPixel: 8,
      compression: 0,
      numberOfDataBytes: null, // later
      pixelsPerMeterX: 0,
      pixelsPerMeterY: 0,
      numberOfUsedColors: 0,
      numberOfImportantColors: 0,
    };

    header.numberOfDataBytes = this.width * this.height;
    header.fileSize = header.dataOffset + header.numberOfDataBytes;

    const fileBuffer = Buffer.alloc(header.fileSize);
    BitmapFileHeader.pack(header, fileBuffer);

    this.palette.copy(fileBuffer, BitmapFileHeader.size);
    this.data.copy(fileBuffer, header.dataOffset);

    return fileBuffer;
  }

  async dumpPng() {
    let resolve;
    let reject;
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    const buffer = await this.dumpBmp();
    jimp.read(buffer, (err, image) => {
      if (err) {
        return reject(err);
      }

      image.getBuffer(jimp.MIME_PNG, (err, buffer) => {
        if (err) {
          return reject(err);
        }

        resolve(buffer);
      });
    });

    return promise;
  }

  async dumpJpeg() {
    let resolve;
    let reject;
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    const buffer = await this.dumpBmp();
    jimp.read(buffer, (err, image) => {
      if (err) {
        return reject(err);
      }

      image.getBuffer(jimp.MIME_JPEG, (err, buffer) => {
        if (err) {
          return reject(err);
        }

        resolve(buffer);
      });
    });

    return promise;
  }
}

module.exports = {
  Bitmap,
};
