import * as os from "os";
import * as path from "path";

import * as asar from "asar";
import * as diff from "diff";
import * as fs from "fs-extra";
import natsort from "natsort";

import {baseDir} from "../global";
import {CURRENT_PLATFORM, Platforms} from "./platform";
import {strict} from "assert";

/**
 * Patcher options
 */
export interface IPatcherOptions {
  /**
   * app.asar file
   */
  readonly asar?: string;

  /**
   * app directory
   */
  readonly dir?: string;

  /**
   * Patcher features
   */
  readonly features: string[];
}

/**
 * Patcher
 */
export class Patcher {
  private static findAsarUnix(...files: string[]): string | undefined {
    return files.find((file) => fs.existsSync(file));
  }

  private static findAsarLinux(): string | undefined {
    return Patcher.findAsarUnix(
      "/opt/gitkraken/resources/app.asar", // Arch Linux
      "/usr/share/gitkraken/resources/app.asar", // deb & rpm
    );
  }

  private static findAsarWindows(): string | undefined {
    const gitkrakenLocal = path.join(os.homedir(), "AppData/Local/gitkraken");
    if (!fs.existsSync(gitkrakenLocal)) {
      return undefined;
    }
    const apps = fs
      .readdirSync(gitkrakenLocal)
      .filter((item) => item.match(/^app-\d+\.\d+\.\d+$/));
    let app = apps.sort(natsort({desc: true}))[0];
    if (!app) {
      return undefined;
    }
    app = path.join(gitkrakenLocal, app, "resources/app.asar");
    return fs.existsSync(app) ? app : undefined;
  }

  private static findAsarMacOS(): string | undefined {
    return Patcher.findAsarUnix(
      "/Applications/GitKraken.app/Contents/Resources/app.asar",
    );
  }

  private static findAsar(dir?: string): string | undefined {
    if (dir) {
      return path.normalize(dir) + ".asar";
    }
    switch (CURRENT_PLATFORM) {
      case Platforms.linux:
        return Patcher.findAsarLinux();
      case Platforms.windows:
        return Patcher.findAsarWindows();
      case Platforms.macOS:
        return Patcher.findAsarMacOS();
    }
  }

  private static findDir(asarFile: string): string {
    return path.join(
      path.dirname(asarFile),
      path.basename(asarFile, path.extname(asarFile)),
    );
  }

  private readonly _asar: string;
  private readonly _dir: string;
  private readonly _features: string[];

  /**
   * Patcher constructor
   * @param options Options
   */
  public constructor(options: IPatcherOptions) {
    const maybeAsar = options.asar || Patcher.findAsar(options.dir);
    if (!maybeAsar) {
      throw new Error("Can't find app.asar!");
    }
    this._asar = maybeAsar;
    this._dir = options.dir || Patcher.findDir(this.asar);
    this._features = options.features;
    if (!this.features.length) {
      throw new Error("Features is empty! ");
    }
  }

  /**
   * app.asar file
   */
  public get asar(): string {
    return this._asar;
  }

  /**
   * app directory
   */
  public get dir(): string {
    return this._dir;
  }

  /**
   * Patcher features
   */
  public get features(): string[] {
    return this._features;
  }

  private unpackFileFromAsar(filename: string): void {
    // 解压出具体文件 给出的是 Buffer
    let fileBuffer = asar.extractFile(this.asar, filename);
    let fileDst: string = path.join(this.dir, filename);
    fs.ensureDirSync(path.dirname(fileDst));
    // 要把解压出来的东西放在这里
    fs.writeFileSync(fileDst, fileBuffer);
  }

  // 这里是直接重写的应用补丁
  public applyPatch(): void {
    // 一开始先清理一下
    this.removePatch();
    for (const feature of this.features) {
      this.applyPatchWithFeature(feature);
    }
  }
  private applyPatchWithFeature(feature: string): void {
    // 首先要解析补丁
    const patches = diff.parsePatch(
      fs.readFileSync(path.join(baseDir, "patches", `${feature}.diff`), "utf8"),
    );
    // 输出一下补丁信息
    for (const patch of patches) {
      // console.log(patch);
      // 先确定文件名,再解压和 Patch
      let oldFileName: string = String(patch.oldFileName);
      // console.log(oldFileName);
      this.applyPatchToFile(oldFileName, patch);
    }
  }

  private applyPatchToFile(filename: string, patch: diff.ParsedDiff): void {
    this.unpackFileFromAsar(filename);
    const sourceData = fs.readFileSync(
      path.join(this.dir, patch.oldFileName!),
      "utf8",
    );
    const sourcePatchedData = diff.applyPatch(sourceData, patch);
    if ((sourcePatchedData as any) === false) {
      throw new Error(`Can't patch ${patch.oldFileName}`);
    }
    if (patch.oldFileName !== patch.newFileName) {
      fs.unlinkSync(path.join(this.dir, patch.oldFileName!));
    }
    fs.writeFileSync(
      path.join(this.dir, patch.newFileName!),
      sourcePatchedData,
      "utf8",
    );
  }

  // 这里加入移除补丁
  public removePatch(): void {
    // 防止误操作,必须是存在 asar 的文件夹
    if (fs.existsSync(this.asar)) {
      // console.log(this.dir);
      let asarDir: string = this.asar.split(".").slice(0, -1).join(".");
      fs.removeSync(asarDir);
      console.log(asarDir);
    }
    // console.log("this.asar:", this.asar);
    // console.log("this.dir:", this.dir);
  }
}
