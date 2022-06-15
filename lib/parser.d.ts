import Base from 'sdk-base';
import * as fs from 'fs';
import { WixImageInfo } from 'wix-parser';

import { Bitmap } from './bitmap';

interface WilFileImageInfo {
  width: number;
  height: number;
  px: number;
  py: number;
}

export class Wil extends Base {
  filename: string;
  wixFilename: string;

  wix: WixImageInfo;
  fd: fs.promises.FileHandle;

  title: string;
  colorCount: number;
  paletteSize: number;
  palette: Buffer;
  wilFileImageInfos: WilFileImageInfo[];
  fileSize: number;

  constructor(filename: string, wixFilename?: string | null);
  count(): number;
  destroy(): Promise<void>;

  getBitmap(idx: number): Bitmap;
}

export function parse(filename: string, wilFilename?: string | null): Wil;
