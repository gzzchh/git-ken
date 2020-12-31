import * as os from "os";
import * as path from "path";

import * as asar from "asar";
import * as diff from "diff";
import * as fs from "fs-extra";
import natsort from "natsort";

import {baseDir} from "../global";
import {CURRENT_PLATFORM, Platforms} from "./platform";

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

  /**
   * Backup app.asar file
   * @throws Error
   */
  public backupAsar(): string {
    const backup = `${this.asar}.${new Date().getTime()}.backup`;
    const oriBackup = `${this.asar}.orig`;
    if (!fs.existsSync(oriBackup)) {
      fs.copySync(this.asar, oriBackup);
    }
    fs.copySync(this.asar, backup);
    return backup;
  }

  /**
   * Unpack app.asar file into app directory
   * @throws Error
   */
  public unpackAsar(): void {
    asar.extractAll(this.asar, this.dir);
  }

  /**
   * Pack app directory to app.asar file
   * @throws Error
   */
  public packDirAsync(): Promise<void> {
    return asar.createPackage(this.dir, this.asar);
  }

  /**
   * Remove app directory
   * @throws Error
   */
  public removeDir(): void {
    fs.removeSync(this.dir);
  }
  /**
   * 清理 asar 的备份
   * @throws Error
   */
  public cleanbackup(): void {
    let backupDir = path.dirname(this.asar);
    // console.log(backupDir);
    // 匹配备份文件
    let filter = /\.backup$/;
    // 读取和扫描
    let files = fs.readdirSync(backupDir);
    files.forEach(function (filename) {
      let fullPath = path.join(backupDir, filename);
      // 匹配则删除
      if (filter.test(fullPath)) {
        fs.removeSync(fullPath);
      }
    });
  }

  /**
   * Patch app directory
   * @throws Error
   */
  public patchDir(): void {
    for (const feature of this.features) {
      this.patchDirWithFeature(feature);
    }
  }

  private patchDirWithFeature(feature: string): void {
    const patches = diff.parsePatch(
      fs.readFileSync(path.join(baseDir, "patches", `${feature}.diff`), "utf8"),
    );
    for (const patch of patches) {
      this.patchDirWithPatch(patch);
    }
  }

  private patchDirWithPatch(patch: diff.ParsedDiff): void {
    const sourceData = fs.readFileSync(
      path.join(this.dir, patch.oldFileName!),
      "utf8",
    );
    const sourcePatchedData = diff.applyPatch(sourceData, patch);
    // console.log("原路径:" + path.join(this.dir, patch.oldFileName!));
    // console.log("Patch中的原路径:" + patch.oldFileName);
    if ((sourcePatchedData as any) === false) {
      // console.error(sourcePatchedData);
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
}
