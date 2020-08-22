import * as chalk from "chalk";
import * as program from "commander";
import * as emoji from "node-emoji";
import * as path from "path";

import {Logo, Patcher} from "../";

const enum Actions {
  patch = 1,
  remove = 2,
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
      case Actions.patch: {
        // 解压指定文件并 Patch
        console.log(
          `${chalk.green("==>")} ${emoji.get("hammer")} Patch ${chalk.green(
            patcher.dir,
          )} ` +
            `with ${patcher.features
              .map((feature) => `${chalk.green(feature)}`)
              .join(", ")} features`,
        );
        patcher.applyPatch();
        break;
      }
      // 移除补丁
      case Actions.remove: {
        console.log(
          `${chalk.green("==>")} ${emoji.get("fire")} 移除补丁 ${chalk.green(
            patcher.dir,
          )}`,
        );
        patcher.removePatch();
        break;
      }
    }
    console.log(`${chalk.green("==>")} ${emoji.get("ok_hand")} Patching done!`);
  }
}

program
  .name("gitcracken-patcher")
  .description("GitKraken patcher")
  .option("-a, --asar <file>", "app.asar file")
  .option("-d, --dir <dir>", "app directory")
  .option(
    "-f, --feature <value>",
    `要补丁的功能集,可选:
      development (切换为开发版本-与切换为登台版本冲突),
      staging (切换为登台版本-与切换为开发版本冲突),
      individual (个人版),
      pro (专业版),
      selfhosted (自托管版),
      standalone (独立版)
    `,
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
      // 此处为默认操作
      actions.push(Actions.patch, Actions.remove);
    } else {
      strActions.forEach((item) => {
        switch (item.toLowerCase()) {
          case "patch":
            actions.push(Actions.patch);
            break;
          case "remove":
            actions.push(Actions.remove);
            break;
        }
      });
    }
    await executeActions(actions);
  })
  .parse(process.argv);
