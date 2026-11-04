# dsh-composer-suggestion · 输入框建议

[English](./README.md) · [中文](./README.zh-CN.md)

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的输入框加**幽灵文本建议**：
一轮对话结束后自动给出一条「下一句」，按 **Tab** 接受为可编辑草稿；另有独立开关可开启打字时的草稿预测。

本项目是 [Stijnus/dsh-composer-predictions](https://github.com/Stijnus/dsh-composer-predictions)
的个人 fork，与上游的差别见下。

## 两种触发（各自独立开关）

| 触发 | 何时请求 | 默认 |
|---|---|---|
| **下一步建议** | 一轮结束、输入框为空，静置 600ms 后 | **开** |
| **当前输入框预测** | 打字停顿、光标在草稿末尾，静置 500ms 后 | 关 |

- 建议以幽灵文字渲染在输入框内，显示期间会隐藏原生 placeholder，两者不会叠字。
- **Tab** 接受进草稿，**Alt+↑ / Alt+↓** 切换候选，**Esc** 忽略当前这条。
- 接受后只是草稿，**不会替你发送**。
- 页面在后台、正在中文输入法拼写、或草稿不足 3 个字符时，都不会发请求。

## 设置

`设置 → 输入建议` 是插件自己的页面，里面就是上面两个开关，保存在当前浏览器。

上游只有一个总开关，这里拆成两个：两者的成本差着一个数量级（每回合一次 vs 每次打字停顿一次），
适用场景也不同。

## 配置

bundle 的 `cordis.patch.yml` 中 `composer-suggestion` 条目：

| 键 | 默认 | 含义 |
|---|---|---|
| `sharePromptCache` | `true` | 复用主请求的前缀（工具定义 + 完整历史），让服务商的前缀缓存命中；设为 `false` 则退回小请求。|
| `maxOutputTokens` | `220` | 单次建议的输出上限。|
| `timeoutMs` | `20000` | 单次超时。|
| `maxSuggestions` | `3` | 候选条数（Alt+↑↓ 切换）。|
| `maxMessages` / `maxChars` / `maxToolNotes` | `10` / `8000` / `6` | 仅在 `sharePromptCache: false` 时生效。|
| `provider` / `model` | 继承会话 | 固定路由，必须成对。|
| `reasoningEffort` | 继承会话 | 仅在关闭共享前缀时有意义。|

默认走会话自己的 provider/model。开启 `sharePromptCache` 时**原样继承主请求的控制参数**
（包括推理档）——改了会改变请求形状，反而把缓存打没。

## 成本

「下一步建议」每回合最多一次有界调用；「输入框预测」**每次打字停顿**都会请求，明显更贵，所以默认关闭。
开启共享前缀后，输入的大头由服务商的前缀缓存承担，新增 token 只有上一条回复和一句指令。

## 安装

```
plugin_manager(action="install_bundle", target="/绝对路径/packages/dsh-composer-suggestion")
```

装完刷新一次客户端页面，浏览器侧才会被载入。

## 与上游的差别

- **独立包名**（`dsh-composer-suggestion`）与独立的 bundle 行，可以和上游包**并存**安装。
- **每个触发一个开关**，并有自己的设置页。
- **`sharePromptCache`**：Host 直接发送 agent loop 用过的那个前缀，让服务商缓存生效；失败自动回退到自包含小请求。
- **身份不变量有测试**：`test/client-registration.test.js` 会在 client bundle 的注册 id 与 `package.json` 名不一致时失败——
  这个不一致会让模块加载器重跑整批资源并中断页面启动。

## 开发

```
node --test     # 跑 test/ 下的测试
```

`client.js` 与 `index.js` 就是源码，没有构建步骤。

## 许可

MIT。基于 Stijnus 的
[dsh-composer-predictions](https://github.com/Stijnus/dsh-composer-predictions)；
上游版权声明保留在 [LICENSE](LICENSE)。
