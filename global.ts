/// <reference path="./types/index.d.ts" />

import * as path from "path";

import * as fs from "fs-extra";
import * as pkgDir from "pkg-dir";

/**
 * Base directory with package.json
 */
export const baseDir = pkgDir.sync(__dirname) as string;
// export const baseDir = process.cwd() as string;

/**
 * package.json
 */
// console.log(process.cwd());
export const packageJson: {
  author: string;
  description: string;
  homepage: string;
  license: string;
  name: string;
  version: string;
  // } = fs.readJsonSync(path.join(baseDir, "package.json"));
} = fs.readJsonSync(path.join(baseDir, "package.json"));
