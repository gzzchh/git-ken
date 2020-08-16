# GitCracken

GitKraken 的破解工具

支持 Linux(非 Snap) ,Windows, macOS

> 警告! macOS 用户请务必运行一次程序然后完全退出

## 依赖

- `NodeJS` 12 或更高
- `yarn`

## 构建

- `yarn install`
- `yarn package` 构建三平台二进制,位于 package 文件夹
- `node dist/bin/gitcracken.js --help` 来获取使用信息

### Patcher

```bash
$ gitcracken patcher [options] [actions...]
```

`actions` - array of values (any order, any count)

> If `actions` is empty, will be used `auto` mode (ideal for beginners)

| Action   | Description                                 |
| -------- | ------------------------------------------- |
| `backup` | Backup `app.asar` file                      |
| `unpack` | Unpack `app.asar` file into `app` directory |
| `patch`  | Patch `app` directory                       |
| `pack`   | Pack `app` directory to `app.asar` file     |
| `remove` | Remove `app` directory                      |

| Option            | Description (if not defined, will be used `auto` value)         |
| ----------------- | --------------------------------------------------------------- |
| `-a`, `--asar`    | Path to `app.asar` file                                         |
| `-d`, `--dir`     | Path to `app` directory                                         |
| `-f`, `--feature` | Patcher feature (from [patches](patches) dir without extension) |

> You can invoke `-f`, `--feature` several times to apply all patches!

### Examples

`Auto` patch installed `GitKraken` (maybe require `sudo` privileges on `GNU/Linux`)

```bash
$ gitcracken patcher
```

Use custom path to `app.asar`

```bash
$ gitcracken patcher --asar ~/Downloads/gitkraken/resources/app.asar
```

Use custom `actions` (`backup`, `unpack` and `patch`)

```bash
$ gitcracken patcher backup unpack patch
```

## Disable Automatic Update

Add this content to your `hosts` file:

```text
0.0.0.0 release.gitkraken.com
```
