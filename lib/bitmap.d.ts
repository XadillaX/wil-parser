export class Bitmap {
  width: number;
  height: number;
  data: Buffer;
  palette: Buffer;
  colorCount: number;

  constructor(width: number, height: number, data: Buffer, colorCount: number, palette: Buffer);
  dumpBmp(): Promise<Buffer>;
  dumpPng(): Promise<Buffer>;
  dumpJpeg(): Promise<Buffer>;
}
