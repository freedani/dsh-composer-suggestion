# 发布与分发

这份文档写给这个仓库的维护者（也就是你自己）。它回答两个问题：**怎么发出去**、
**发之前必须检查什么**。不需要读完 DSH 的插件文档。

---

## 两条路，先想清楚给谁用

| 路径 | 需要注册 npm？ | 适合 | 用户怎么装 |
|---|---|---|---|
| **A. 只用 GitHub** | 不需要 | 给自己和朋友用，人不多 | 一条 `install_bundle` 命令（见下） |
| **B. 发到 npm** | 需要 | 想让陌生人也能装、想让插件市场收录 | 包名，或市场里点一下 |

两条路的代码完全一样，区别只是"别人怎么拿到它"。可以先用 A，等确定要给别人用再补 B。

---

## 发布前必查（两条路都要过）

在 `packages/dsh-composer-suggestion/` 里执行：

```bash
node --test                                  # 必须全绿（当前 37/37）
node --check client.js && node --check index.js
npm pack --dry-run                           # 看包里到底有什么，当前 11 个文件
node -p "JSON.stringify(require('./package.json').dependencies||{})"   # 必须是 {}
```

四条硬规则，违反任何一条都可能把用户的 DSH 搞坏：

1. **运行时依赖必须为空**。`dependencies` 里一旦出现 `@deepseek-ai/*` 的精确版本，
   profile 的 hoisted 安装会把它提升到顶层、遮蔽宿主自带的那份 —— 这正是 2026-10-27
   和 2026-11-04 两次白屏的机制。需要 peer 就用 `peerDependencies`（不装），不要用 `dependencies`。
2. **client bundle 的 loader id 必须等于包名**。
   `client.js` 顶部 `window.__ModuleLoader__.load({ id })` 与 `package.json` 的 `name` 不一致时，
   加载器会重跑整批资源、抛 `duplicate factory registration`，把同批所有模块一起带崩。
   `test/client-registration.test.js` 已经在守这条。
3. **`engines.dsh` 要覆盖当前 DSH 版本**。现在是 `>=0.2.1-rc.3 <0.3.0-0`。
   DSH 发 `0.3.x` 的时候，市场会把你标成不兼容、安装会被拦下来（错误码 `incompatible-version`）。
4. **改了行为就改版本号和 `CHANGELOG.md`**。npm 不允许重发同一个版本。

---

## 路径 A：只用 GitHub（零注册）

### 发一个版本

```bash
git tag v0.1.0
git push origin v0.1.0
```

### 别人怎么装

```
plugin_manager(action="install_bundle", target="github:freedani/dsh-composer-suggestion#v0.1.0")
```

也可以给 `#main` 或某个 commit sha。**建议钉 tag**：`main` 会动，别人重装就换了内容。

### 注意

- git 来源的包在 `pnpm` 拉下来**之后**才做 `engines.dsh` 检查；不兼容时安装会失败并回滚 profile 的
  清单与锁文件，不会留下半装状态，但已经跑过的构建脚本副作用不会被撤销（本包没有构建脚本）。
- 更新：改完代码打新 tag，让对方用新的 tag 重装（或 `set_bundle` 开关一次）。

---

## 路径 B：发到 npm

只有当你希望**不认识的人**也能按包名装上时才需要。第一次做一次性的准备工作要几分钟。

### 首次准备（只做一次）

1. 注册：<https://www.npmjs.com/signup>（邮箱 + 用户名 + 密码）。
2. 验证邮箱（不验证不能发布）。
3. 打开两步验证（npm 会要求；用 Authenticator 应用或 passkey 都行）。
4. 本机登录：
   ```bash
   npm login        # 浏览器会打开授权页；成功后 npm whoami 应打印你的用户名
   ```

### 发布

```bash
cd packages/dsh-composer-suggestion
npm publish --access public
```

0.x 版本默认就是 public；如果包名想带作用域（`@freedani/dsh-composer-suggestion`），
发布时加 `--access public`，并且 `package.json` 的 `name` 要先改。

### 发布后验证

```bash
npm view dsh-composer-suggestion version      # 应打印 0.1.0
```

然后找一台干净的机器（或另一个 profile）装一次：

```
plugin_manager(action="install_bundle", target="dsh-composer-suggestion")
```

### 更新版本

```bash
# 1. 改代码 / 文档，更新 CHANGELOG.md
# 2. 提升版本号（0.1.0 -> 0.1.1 修 bug，0.2.0 改行为）
npm version patch          # 或 minor / major，会自动改 package.json 并打 git tag
git push --follow-tags
npm publish
```

### 发错了怎么办

npm 只允许在发布后 **72 小时内**、且没有别的包依赖它时 `npm unpublish`。
过了窗口就只能**发一个新版本修**（这也是为什么发之前要跑 `npm pack --dry-run` 看清楚内容）。

---

## 可选：进插件市场（以后想做再看）

DSH 没有中心仓库。官方「插件 → 发现」读的是**用户自己添加的索引 URL**（format 1 的 JSON）。
想让陌生人能在应用内搜到你并一键安装，需要：

1. 在仓库里放一份 `market-index.json`（列出插件名、简介、作者、仓库、版本、`engines.dsh`），
   用户把它的 raw 链接加进「插件 → 发现 → 索引源」。
2. 或者向社区目录 `awesome-dsh-plugin/awesome-dsh-plugin` 提一个 PR，只加一条条目；
   站点与 dshmarket 市场会自动同步（通常一天内）。

只有你已经能装（路径 A 或 B）之后，这一步才有意义。

---

## 装的人可能会遇到的坑（写进 README 或答问时用）

| 现象 | 原因 | 处理 |
|---|---|---|
| `incompatible-version` | `engines.dsh` 不含用户当前的 DSH 版本 | 要么发版放宽范围，要么让用户用 `set_version_exemption` 显式承担风险 |
| 装完看不到建议 | 页面没重新加载，或两个开关都关了 | 刷新页面；检查「设置 → 输入建议」 |
| 打字时频繁请求 | 「当前输入框预测」被打开 | 关掉那个开关即可，不用卸载 |
| profile 启动崩 | 大概率是依赖遮蔽（见上「四条硬规则」第 1 条） | 卸载该 bundle，检查 `node_modules/@deepseek-ai/` 是否多出与宿主同名的包 |
