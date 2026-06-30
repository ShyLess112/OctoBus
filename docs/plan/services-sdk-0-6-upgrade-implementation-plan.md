# Services SDK 0.6.0 升级实施计划

输入 spec：`docs/spec/services-sdk-0-6-upgrade-spec.md`

输出目标：将 `services/` 多服务包统一升级到 `@chaitin-ai/octobus-sdk` `^0.6.0`，并按低风险优先原则使用 SDK 0.6.0 helper 收敛重复实现，同时保持 service package 公开契约和错误语义稳定。

## 阶段 1：基线确认和变更清单

目标：确认当前仓库、npm registry 和 services package 状态与 spec 一致，形成后续批量修改的准确输入。

依赖：无。

实施工作：

1. 确认 SDK 发布事实：
   - 运行 `npm view @chaitin-ai/octobus-sdk@latest version dependencies engines main types bin --json`。
   - 结果必须显示 `version` 为 `0.6.0`，`engines.node` 为 `>=20`，并包含 `undici` 依赖。
2. 确认 services 依赖范围：
   - 扫描 `services/package.json` 和 `services/*/package.json` 中的 `@chaitin-ai/octobus-sdk`。
   - 确认共有 51 处 dependency 声明需要从 `^0.5.0` 改为 `^0.6.0`。
3. 确认生成物边界：
   - 检查 `.gitignore` 和 `docs/design/technical/release.md`，确认 `services/package-lock.json`、`node_modules/` 和 pack artifact 不应提交。
   - 检查 `git status --short`，记录已有未提交变更，实施时不得回滚无关文件。
4. 确认 services 脚本可用：
   - 读取 `services/package.json` scripts，确认 `validate`、`test`、`coverage:all`、`import:check`、`pack:check` 均存在。

测试和验证：

- `npm view @chaitin-ai/octobus-sdk@latest version`
- `rg '"@chaitin-ai/octobus-sdk": "\\^0\\.5\\.0"' services/package.json services/*/package.json`
- `git status --short`

验收标准：

- 确认目标版本为 `^0.6.0`，不使用 `latest`。
- 确认只需要修改 tracked package/doc/test 文件，不提交 `services/package-lock.json` 或 `node_modules`。
- 如果 npm registry 无法确认 0.6.0，停止实施并报告阻塞。

适用 harness 约束或命令：

- `AGENTS.md` 要求使用 Task 作为主工作流，并保护用户已有工作树变更。
- `docs/design/technical/release.md` 要求普通 lockfile、`services/package-lock.json` 和 `node_modules/` 不进入版本控制。

## 阶段 2：统一 SDK dependency 版本

目标：完成纯依赖版本升级，不改动业务源码、不改变 runtime 行为。

依赖：阶段 1 完成。

实施工作：

1. 批量修改以下文件中的 SDK dependency：
   - `services/package.json`
   - 所有 `services/*/package.json`
2. 将每个 `dependencies["@chaitin-ai/octobus-sdk"]` 从 `^0.5.0` 改为 `^0.6.0`。
3. 保留每个文件的既有 dependency 顺序、缩进和其他依赖版本。
4. 不修改 `services/package-lock.json`；如果本地安装或测试生成该文件，保持未跟踪并不纳入提交。
5. 更新依赖版本相关的 fixture 和说明：
   - `services/tests/validate-service-package.test.mjs` 中测试 fixture 的 SDK 版本字符串改为 `^0.6.0`。
   - `services/first__epss-v1/README.md` 中 SDK 版本说明改为 `^0.6.0`。
   - `docs/design/technical/multi-service-npm-package.md` 和 `docs/design/technical/service-package.md` 中 services package 示例依赖改为 `^0.6.0`。

测试和验证：

- `rg '"@chaitin-ai/octobus-sdk": "\\^0\\.5\\.0"' services`
- `rg '\\^0\\.5\\.0|0\\.5\\.0' services docs/design/technical/multi-service-npm-package.md docs/design/technical/service-package.md`
- `cd services && npm run validate`
- `cd services && npm test`
- `cd services && npm run pack:check`

验收标准：

- `services/` 下不再有 `@chaitin-ai/octobus-sdk` `^0.5.0` dependency。
- `services/package.json` 根 `bundledDependencies` 仍包含 `@chaitin-ai/octobus-sdk`、`commander`、`undici` 和 `@alicloud/swas-open20200601`。
- 不产生需要提交的 lockfile、node_modules、pack artifact、日志或 secret。
- validate、test、pack check 均通过。

适用 harness 约束或命令：

- `docs/design/technical/services-package-quality.md` 要求 root dependency、bundled dependency、bin、files 和 service root 结构通过 `services/scripts/validate-service-package.mjs`。
- `docs/design/technical/release.md` 要求 `services/` 保持 private，且不提交 `services/package-lock.json`。

风险和停止条件：

- 如果仅升级依赖导致任一 service 测试失败，停止 helper 重构，先定位 SDK 0.6.0 兼容性问题。
- 如果 `npm run pack:check` 显示意外打包了本地生成物，必须先清理生成物并复跑。

## 阶段 3：抽取低风险 helper 迁移候选

目标：为后续源码迁移建立可执行清单，只选择语义等价或近似机械替换的 helper，不触碰 service 特化业务语义。

依赖：阶段 2 完成且基础门禁通过。

实施工作：

1. 扫描 service 源码，按以下类别生成候选清单：
   - 本地 `grpcCodeFor` 状态表或 `new GrpcError(grpcCodeFor(...))` 包装。
   - `{ ...(ctx.config ?? {}), ...(ctx.secret ?? {}) }` 或等价 config/secret merge。
   - 手写 `AbortController`、`setTimeout`、`AbortSignal.timeout`、`makeTimeoutSignal`、`fetchWithTimeout`。
   - 手写 `undici.Agent({ connect: { rejectUnauthorized: false } })` 或动态 `import("undici")` TLS dispatcher。
   - response `.text()` 读取、JSON parse、错误脱敏摘要。
2. 将候选分为三类：
   - A 类：可直接使用 SDK helper 且不会改变错误码、message、details 或测试断言。
   - B 类：可部分使用 SDK helper，但必须保留 service 自己的错误映射或 payload shape。
   - C 类：暂不迁移，包括自定义 business code、登录/session、签名、非 JSON 成功响应、`google.protobuf.Value`
     手写转换和已知测试要求特殊错误码的逻辑。
3. 在实施记录中明确每个将被迁移的 service root 和类别；不要修改不在清单内的 service。

测试和验证：

- 使用 `rg` 生成候选，例如：
  - `rg -n "const grpcCodeFor|function grpcCodeFor|new GrpcError\\(grpcCodeFor" services/*/src/*.js`
  - `rg -n "AbortController|AbortSignal\\.timeout|makeTimeoutSignal|fetchWithTimeout" services/*/src/*.js`
  - `rg -n "new Agent\\(|import\\('undici'\\)|from 'undici'|from \\"undici\\"" services/*/src/*.js`
  - `rg -n "\\.\\.\\.\\(ctx\\??\\.config \\?\\? \\{\\}\\)|\\.\\.\\.\\(ctx\\??\\.secret \\?\\? \\{\\}\\)" services/*/src/*.js`

验收标准：

- 清单只包含能用现有测试验证的 service。
- 每个候选都有对应 service-local test 文件。
- 对 C 类明确不迁移，避免实施时扩大范围。

适用 harness 约束或命令：

- `docs/design/technical/services-package-quality.md` 要求 service 特化业务字段、上游 API 语义和 mock upstream 由各 service README、proto、schema 和测试维护。

风险和停止条件：

- 如果某个候选需要先解释上游业务语义或更改测试断言，降级为 C 类并延后。
- 如果候选迁移会改变 `mapHttpStatusToCode`、`readResponseJson` 或 `toValue` 语义，不纳入低风险批次。

## 阶段 4：迁移通用 context 和错误构造 helper

目标：优先收敛不会发起网络请求的重复代码，降低行为回归风险。

依赖：阶段 3 A/B 类候选清单完成。

实施工作：

1. 对 A 类 service，将本地状态码映射表替换为 SDK `grpcCodeFor` 或 `serviceError`：
   - 若既有 error message 形如 `${code}: ${message}`，保留该 message shape。
   - 若既有错误对象设置 `legacyCode`、`details`、`response` 或 `httpStatus`，继续保留。
2. 对 A 类 service，将纯 config/secret merge 替换为：
   - `import { mergeConfigSecret } from "@chaitin-ai/octobus-sdk";`
   - `const mergedBindings = (ctx = {}) => ({ ...mergeConfigSecret(ctx), ...(ctx.bindings ?? {}) });`
3. 对 metadata helper 候选使用 `getMetadataValue(ctx, key)`，但只替换不改变 metadata key 优先级的代码。
4. 不修改 handler signature，不把内部 helper 的 `(req, ctx)` 改成 public handler 形态。

测试和验证：

- 对每个修改的 service：
  - `cd services && npm run validate -- --service-dir <service-dir>`
  - `cd services && npm test -- --service-dir <service-dir>`
  - `cd services && npm test -- --coverage --service-dir <service-dir>`
- 批次完成后：
  - `cd services && npm run validate`
  - `cd services && npm test`

验收标准：

- 被迁移 service 的错误码、message、legacy fields 和测试断言保持不变。
- production `handlers` 仍为单参数 `ctx`。
- 不新增对 untracked generated artifact 的依赖。

适用 harness 约束或命令：

- `services/scripts/run-tests.mjs` coverage 模式默认要求 branch、function、line 均达到 90%。
- `services/scripts/validate-service-package.mjs` 会拒绝可静态检测的双参数 exported handler。

风险和停止条件：

- 如果 helper 替换导致错误对象字段或 message 变化，回退该 service 的该项迁移，保留旧实现。
- 如果一个 service 缺少足够覆盖错误语义的测试，先补 focused test，再迁移。

## 阶段 5：迁移 HTTP timeout、TLS 和 response 读取 helper

目标：用 SDK 0.6.0 HTTP helper 替换重复的低层 fetch 设施，同时保持 service 的上游错误映射和 payload shape。

依赖：阶段 4 完成并通过基础门禁。

实施工作：

1. 对 A 类或明确可控的 B 类 service，替换手写 timeout 和 TLS helper：
   - 使用 `normalizeTimeoutMs` 解析 timeout。
   - 使用模块级缓存的 `createTlsDispatcher(true)` 提供 TLS skip dispatcher。
   - 使用 `fetchWithTimeout(url, init, { timeoutMs, dispatcher })` 发起请求。
2. 不把 `timeoutMs`、`skipTlsVerify`、`tlsInsecureSkipVerify`、`insecureSkipVerify` 等伪字段传入原生 `fetch`。
3. 对 response body 读取：
   - 只在 body read failure 语义一致时使用 `readResponseText`。
   - 只在非法 JSON 应映射为 `INTERNAL` 的 service 中使用 `readResponseJson`。
   - 若 service 当前非法 JSON 必须是 `UNKNOWN`，保留本地 parse wrapper 或用 `readResponseText` 后本地 parse。
4. 对 HTTP status：
   - 只有当 SDK 默认 `mapHttpStatusToCode` 与 service 测试一致时，才使用 `httpStatusError`。
   - 其他 service 只复用 `safeErrorSummary`、`redactSensitive` 等不改变 code 的 helper。

测试和验证：

- 对每个修改的 service：
  - `cd services && npm run validate -- --service-dir <service-dir>`
  - `cd services && npm test -- --service-dir <service-dir>`
  - `cd services && npm test -- --coverage --service-dir <service-dir>`
- 每个批次完成后：
  - `cd services && npm test`
  - `cd services && npm run pack:check`

验收标准：

- 被迁移 service 的 mock upstream 测试覆盖 timeout、TLS skip、network failure、body read failure、HTTP 4xx/5xx 至少一个关键路径。
- 不再有被迁移 service 自己的重复 `undici.Agent` 创建逻辑，除非该 service 仍需特殊 dispatcher 行为。
- 不改变 service 的业务错误码映射和 response field shape。

适用 harness 约束或命令：

- `docs/design/technical/services-package-quality.md` 禁止全局 TLS 降级，要求 timeout 使用真实 abort。
- `services/scripts/validate-service-package.mjs` 会拒绝 `NODE_TLS_REJECT_UNAUTHORIZED` 和 `globalThis.proxy`。

风险和停止条件：

- 如果 `fetchWithTimeout` 的 `DEADLINE_EXCEEDED`、`CANCELLED`、`UNAVAILABLE` 语义与现有测试冲突，停止迁移该 service。
- 如果 SDK `readResponseJson` 的 `INTERNAL` 与 service 的 `UNKNOWN` 语义冲突，不能直接使用该 helper。

## 阶段 6：全量 services 门禁和 import 验证

目标：证明 services package 在依赖升级和 helper 收敛后仍可验证、打包、导入和运行。

依赖：阶段 2 必须完成；阶段 4/5 若执行则必须全部通过 service-local 门禁。

实施工作：

1. 清理不应提交的本地产物：
   - `services/package-lock.json`
   - `services/node_modules/`
   - `*.tgz`、日志、coverage、临时 data dir、`.env`
2. 运行全量 services 门禁：
   - `cd services && npm run validate`
   - `cd services && npm test`
   - `cd services && npm run pack:check`
3. 构建 OctoBus binary 并运行 import check：
   - `task build`
   - `cd services && npm run import:check -- --octobus ../bin/octobus`
4. 如果 helper 迁移覆盖大量 service 或更改了共享模式，运行：
   - `cd services && npm run coverage:all`

测试和验证：

- 上述命令全部通过。
- `git status --short` 中不出现应忽略的生成物。
- `rg '"@chaitin-ai/octobus-sdk": "\\^0\\.5\\.0"' services` 无结果。

验收标准：

- services package 命名、结构、测试、pack dry-run 和 recursive import 均通过。
- 没有新增 service root、proto、schema、bin 或 dispatcher mapping 变化，除非它们只是版本字符串相关文档/fixture 更新。
- 所有被改动 service 的 focused coverage 门禁已通过。

适用 harness 约束或命令：

- `docs/design/technical/services-package-quality.md` 的常用门禁和 OctoBus smoke/import 约束。
- `AGENTS.md` 的 `task build` 和 e2e/import 依赖 Node.js/npm/protoc 要求。

风险和停止条件：

- 如果 import check 失败，停止合并，定位 root package、dispatcher、wrapper 或 SDK runtime 兼容问题。
- 如果 pack check 暴露本地生成物，先清理生成物，不修改 package `files` 来掩盖问题。

## 阶段 7：仓库级回归和文档收束

目标：确认本变更没有破坏仓库级 harness，且文档与实际交付状态一致。

依赖：阶段 6 完成。

实施工作：

1. 复查文档：
   - `docs/spec/services-sdk-0-6-upgrade-spec.md`
   - 本实施计划
   - 被阶段 2 修改的设计文档示例
   - 被源码迁移影响的 service README，如行为或依赖说明发生变化才更新。
2. 运行仓库级门禁：
   - `task lint`
   - `task test`
   - `task build`
3. 如果任何改动影响 package import、routing protocol、supervision、CLI 或 daemon startup，追加运行：
   - `go test ./tests/e2e -count=1`
4. 做最终污染检查：
   - `git status --short`
   - `git ls-files --others --exclude-standard`
   - 确认未提交 `services/package-lock.json`、`node_modules/`、pack artifact、日志、coverage 或 secret。

测试和验证：

- `task lint`
- `task test`
- `task build`
- 条件触发时：`go test ./tests/e2e -count=1`

验收标准：

- 仓库级 lint/test/build 通过。
- 若运行 e2e，e2e 通过。
- 文档中引用的命令与实际 package scripts 一致。
- PR 摘要可说明：升级 SDK dependency、使用 0.6.0 helper 的服务列表、运行过的 services 和仓库级门禁。

适用 harness 约束或命令：

- `AGENTS.md` 要求 PR 前运行 `task`，并在影响 daemon startup、CLI、package import、routing protocols 或 supervision 时运行 e2e。
- `.github/workflows/ci.yml` 的轻量 CI 不覆盖 services 依赖安装，因此本计划必须保留 services 本地门禁。

风险和停止条件：

- 如果 `task test` 由于示例安装本地 SDK 而改变 `examples/*` lockfile 或 node_modules，只清理生成物，不把示例依赖纳入本变更。
- 如果仓库级 Go/e2e 失败且与本变更无关，记录证据并避免混入无关修复；若相关，必须修复后重跑。

## 首版不做的事项

- 不升级 `examples/*` 的 SDK dependency。
- 不发布或改名 `@chaitin-ai/octobus-tentacles`。
- 不修改 SDK 源码、SDK 发布流程或 SDK version。
- 不迁移 services validator/dispatcher 到 SDK multi-service CLI。
- 不删除 service root 的 `undici` 直接依赖，除非对应 service 源码已完成迁移并通过 focused 门禁。
- 不批量替换会改变语义的 HTTP status 映射、非法 JSON 映射或 protobuf `google.protobuf.Value` 手写转换。
- 不改变 proto、schema、service name、bin、handler key、runtime mode 或上游业务字段。

## 计划规则

- 阶段必须按顺序执行；阶段 2 后项目应保持可测试，阶段 4/5 的每个 service 批次后也必须保持可测试。
- 每次 helper 迁移最多处理一组语义相同的 service；如果出现错误语义差异，停止扩大批次。
- 所有改动必须遵守 `docs/design/technical/services-package-quality.md` 的 credential、TLS、timeout 和错误摘要要求。
- 所有本地生成物必须保持 ignored，不得通过 package `files` 或 `.gitignore` 绕过污染问题。
