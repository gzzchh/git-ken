import * as chalk from "chalk";
import * as program from "commander";
import * as emoji from "node-emoji";
import * as path from "path";

import {Logo, Patcher} from "../";

const enum Actions {
  backup = 1,
  unpack = 2,
  patch = 3,
  pack = 4,
  remove = 5,
  clean = 6,
}

async function executeActions(actions: Actions[]) {
  Logo.print();
  const patcher = new Patcher({
    asar: program.asar,
    dir: program.dir,
    features: program.feature,
  });
  for (const action of actions) {
    switch (action) {
      case Actions.backup: {
        console.log(
          `${chalk.green("==>")} ${emoji.get("package")} Backup ` +
            `${chalk.green(patcher.asar)} ➔ ${chalk.green(
              patcher.backupAsar(),
            )}`,
        );
        break;
      }
      case Actions.unpack: {
        console.log(
          `${chalk.green("==>")} ${emoji.get("unlock")} Unpack ${chalk.green(
            patcher.asar,
          )} ➔ ` + `${chalk.green(patcher.dir)}`,
        );
        patcher.unpackAsar();
        break;
      }
      case Actions.patch: {
        console.log(
          `${chalk.green("==>")} ${emoji.get("hammer")} Patch ${chalk.green(
            patcher.dir,
          )} ` +
            `with ${patcher.features
              .map((feature) => `${chalk.green(feature)}`)
              .join(", ")} features`,
        );
        patcher.patchDir();
        break;
      }
      case Actions.pack: {
        console.log(
          `${chalk.green("==>")} ${emoji.get("lock")} Pack ${chalk.green(
            patcher.dir,
          )} ➔ ` + `${chalk.green(patcher.asar)}`,
        );
        await patcher.packDirAsync();
        break;
      }
      case Actions.remove: {
        console.log(
          `${chalk.green("==>")} ${emoji.get(
            "fire",
          )} 删除解压出来的文件夹 ${chalk.green(patcher.dir)}`,
        );
        patcher.removeDir();
        break;
      }
      case Actions.clean: {
        console.log(
          `${chalk.green("==>")} ${emoji.get("fire")} 清理 ${chalk.green(
            path.dirname(patcher.asar),
          )} 中的备份`,
        );
        patcher.cleanbackup();
        break;
      }
    }
  }
  console.log(`${chalk.green("==>")} ${emoji.get("ok_hand")} Patching done!`);
}

program
  .name("gitcracken-patcher")
  .description("GitKraken patcher")
  .option("-a, --asar <file>", "app.asar file")
  .option("-d, --dir <dir>", "app directory")
  .option(
    "-f, --feature <value>",
    "patcher feature",
    (val, memo: string[]) => {
      memo.push(val);
      return memo;
    },
    [],
  )
  .arguments("[actions...]")
  .action(async (strActions?: string[]) => {
    if (program.feature.length === 0) {
      program.feature.push("pro");
    }
    const actions: Actions[] = [];
    if (!strActions || !strActions.length) {
      actions.push(
        Actions.backup,
        Actions.unpack,
        Actions.patch,
        Actions.pack,
        Actions.remove,
        Actions.clean,
      );
    } else {
      strActions.forEach((item) => {
        switch (item.toLowerCase()) {
          case "backup":
            actions.push(Actions.backup);
            break;
          case "unpack":
            actions.push(Actions.unpack);
            break;
          case "patch":
            actions.push(Actions.patch);
            break;
          case "pack":
            actions.push(Actions.pack);
            break;
          case "remove":
            actions.push(Actions.remove);
            break;
          case "clean":
            actions.push(Actions.clean);
            break;
        }
      });
    }
    await executeActions(actions);
  })
  .parse(process.argv);
