# Services SDK 0.6.0 升级技术方案

## 背景与目标

`@chaitin-ai/octobus-sdk` 0.6.0 已发布到 npmjs，`latest` 当前指向 0.6.0。该版本保持
`engines.node >=20`，新增 `undici` 运行时依赖，并公开 context、HTTP、错误和 protobuf JSON
辅助函数。

本方案目标是把 `services/` 下的 `@chaitin-ai/octobus-tentacles` 多服务包统一升级到
`@chaitin-ai/octobus-sdk` `^0.6.0`，并在不改变 service package 对外契约的前提下，用 0.6.0
helper 减少真实 service adapter 中重复维护的通用实现。

升级完成后必须成立：

- `services/package.json` 和 50 个 service root 的 `package.json` 均使用
  `@chaitin-ai/octobus-sdk` `^0.6.0`。
- 现有 service 的 `service.json.name`、proto package、RPC path、bin 名、config/secret schema、
  handler key 和公开响应字段保持兼容。
- service runtime 继续通过 SDK `defineService`、`runServiceMain` 和单参数 `ctx` handler 工作。
- 低风险重复代码优先收敛到 SDK helper；会改变错误码、错误 message、业务 payload 或测试断言的逻辑保留
  service 特化语义。

## 现状和 harness 约束

仓库根 `AGENTS.md` 要求使用 Task 作为主工作流：`task lint`、`task test`、`task build`，并要求
e2e 场景使用 `go test ./tests/e2e -count=1`。AGENTS 还要求遵循既有 domain terms：
service、instance、capset、method binding、descriptor、runtime 和 artifact。

`docs/design/technical/services-package-quality.md` 约束 `services/`：

- `services/` 是 private 的多 service npm distribution package，不是一组独立发布的 npm package。
- 当前包含 50 个含 `service.json` 的 service root。
- 根 `services/package.json` 必须暴露每个 service 的同名 `bin` entry 和默认 dispatcher
  `octobus-tentacles`。
- 子目录 `package.json` 只作为本地开发辅助，不参与 OctoBus import/runtime 依赖解析。
- production handler 必须是单参数 `ctx` 形态，真实请求来自 `ctx.request`。
- credential、session token、cookie、webhook token、AK/SK、password、API key 和私钥等敏感材料优先来自
  instance `secret`，不得在 response、error details、stdout/stderr log、daemon log 或 access log 中泄露。
- timeout 必须通过真实 abort 机制实现，TLS skip 必须使用 per-request 或 per-client `undici.Agent`
  dispatcher，不得修改 `NODE_TLS_REJECT_UNAUTHORIZED`。
- 服务错误语义应保持稳定：必填字段缺失为 `INVALID_ARGUMENT`，认证失败为
  `UNAUTHENTICATED` 或 `PERMISSION_DENIED`，上游 4xx 业务失败为 `FAILED_PRECONDITION`，上游 5xx、
  网络和 body read failure 为 `UNAVAILABLE`，timeout 为 `DEADLINE_EXCEEDED`，无法映射的成功响应为
  `UNKNOWN`。

`docs/design/technical/release.md` 约束发布和生成物：

- `services/` 聚合包保持 `private: true`，不作为 npm 发布对象。
- 普通 `package-lock.json`、示例 lockfile、`services/package-lock.json` 和 `node_modules/` 不进入版本控制。
- 仓库不得提交日志、service artifact、token、secret、私有 `.npmrc` 或内部 registry URL。

当前 services 事实：

- 50 个 service root 的 SDK 依赖均为 `^0.5.0`。
- 依赖形态分三类：1 个 service 同时依赖阿里云 SDK 和 OctoBus SDK，44 个 service 依赖 OctoBus SDK 和
  `undici`，5 个 service 只依赖 OctoBus SDK。
- 根 `services/package.json` 依赖 `@chaitin-ai/octobus-sdk`、`commander`、`undici` 和
  `@alicloud/swas-open20200601`，并通过 `bundledDependencies` 打包运行时依赖。

## 核心概念

- service root：`services/<vendor>__<product>[_version]` 下的单个 OctoBus service 契约和实现。
  它拥有自己的 `service.json`、proto、schema、bin、`src/service.js` 和测试。
- distribution root：`services/` 根包。它拥有根 dispatcher、根 wrapper、根 `files` 和运行时依赖
  bundle 约束。
- SDK runtime helper：0.6.0 从 `@chaitin-ai/octobus-sdk` 导出的通用 helper，用于减少各 service
  重复实现，但不拥有 service 的上游业务语义。
- service 特化语义：某个厂商 API 的认证、HTTP status 映射、业务 code 映射、登录/session、签名、
  非 JSON 响应和响应字段转换。该语义由 service 自身 README、proto、schema 和测试维护。

## 架构和组件边界

SDK 0.6.0 helper 可覆盖以下通用边界：

- `context.ts` 导出 `normalizeContext`、`mergeConfigSecret`、`getMetadataValue`。services 可用它们规范化
  handler context、合并 instance config/secret、读取 metadata。
- `http.ts` 导出 `normalizeTimeoutMs`、`createTlsDispatcher`、`fetchWithTimeout`、`readResponseText`、
  `readResponseJson`、`assertOkResponse`。services 可用它们实现真实 timeout、per-request TLS dispatcher
  和安全 body 读取。
- `errors.ts` 导出 `grpcCodeFor`、`serviceError`、`missingSecretError`、`redactSensitive`、
  `safeErrorSummary`、`httpStatusError`、`mapHttpStatusToCode`。services 可用它们构造 gRPC error、
  脱敏错误摘要和通用 HTTP status 映射。
- `protobuf-json.ts` 导出 `messageJsonSchema`、`protobufMessageToProtoJson`、`fieldJsonName`、
  `normalizeTypeName`。该模块面向 descriptor/message 场景，不直接替代 services 中手写
  `google.protobuf.Value` object shape 的转换函数。

distribution root 继续负责：

- 根 `package.json` dependency、bin、files 和 bundled dependency 声明。
- 根 dispatcher `services/bin/octobus-tentacles.js` 和各 service wrapper。
- `services/scripts/validate-service-package.mjs`、`run-tests.mjs`、`run-coverage-all.mjs`、
  `import-check-all.mjs` 等门禁脚本。

service root 继续负责：

- 上游 API 的认证、请求签名、session cache、业务 code 判断和响应字段映射。
- 对上游 HTTP status 到 gRPC code 的特化映射，除非该映射与 SDK 默认语义完全一致。
- 对历史字段、deprecated credential fallback 和兼容测试的维护。

## API、CLI、配置和数据模型变化

依赖声明变化：

- `services/package.json` 的 `dependencies["@chaitin-ai/octobus-sdk"]` 变为 `^0.6.0`。
- 所有 `services/*/package.json` 的直接 SDK dependency 变为 `^0.6.0`。
- 根 `bundledDependencies` 继续包含 `@chaitin-ai/octobus-sdk`。
- 已直接依赖 `undici` 的 service root 首版继续保留直接依赖；只有当源码不再直接 import `undici` 时，后续才能按服务移除。

不变化的公开接口：

- 不新增或删除 service root。
- 不修改 `service.json` schema、name、proto roots/files、configSchema 或 secretSchema。
- 不修改 root bin key、service-local bin 文件名、dispatcher service mapping 或 `runServiceMain` entryFile 语义。
- 不修改 proto message、RPC method、gRPC full method name、Connect/OpenAPI 可见契约。
- 不修改 OctoBus Go runtime、package import、descriptor、routing protocol 或 supervisor 行为。

helper 使用规则：

- `mergeConfigSecret(ctx)` 只合并 `ctx.config` 和 `ctx.secret`。若既有 service 有 `ctx.bindings` 兼容层，
  保持优先级为 `{ ...mergeConfigSecret(ctx), ...(ctx.bindings ?? {}) }`。
- `fetchWithTimeout` 的 timeout 语义是：超时抛 `DEADLINE_EXCEEDED`，外部 abort 抛 `CANCELLED`，网络失败抛
  `UNAVAILABLE`。使用方不得再把 `timeoutMs`、`skipTlsVerify` 等伪字段直接透传给原生 `fetch`。
- `createTlsDispatcher(true)` 返回 `undici.Agent`。service 应模块级缓存 dispatcher，避免每次请求创建 Agent。
- `readResponseJson` 对非法 JSON 抛 `INTERNAL`。若 service 当前要求非法 JSON 为 `UNKNOWN`，不能直接替换。
- `httpStatusError` 和 SDK `mapHttpStatusToCode` 默认会将 400 映射为 `INVALID_ARGUMENT`、404 映射为
  `NOT_FOUND`。若 service 当前测试或质量线要求上游 4xx 为 `FAILED_PRECONDITION`，不能直接替换。
- `redactSensitive` 和 `safeErrorSummary` 可用于错误 details，但错误 details 不得包含完整 raw body 或 secret-bearing
  字段。

## 工作流和失败语义

升级后的运行工作流保持不变：

1. OctoBus import 从 distribution root 或 service root 读取 package artifact。
2. SDK 根据 `service.json`、package root `bin` 和 `entryFile` 定位 service package。
3. `runServiceMain(service)` 在 `--runtime serve`、`--runtime invoke`、`--runtime dev` 和本地业务 CLI 中填充
   `ctx.request`、`ctx.config`、`ctx.secret`、metadata、serviceId、instanceId、workdir 和 packageDir。
4. service handler 调用上游 API，并返回普通 JavaScript object。
5. SDK runtime 根据 descriptor 完成 protobuf wire format、gRPC server 或本地 CLI ProtoJSON 输出。

失败语义要求：

- SDK 依赖升级本身不得改变现有 service 的错误码和 message 断言。
- helper 替换只能在测试证明语义等价时发生。
- 网络错误、timeout、TLS skip、response read failure、HTTP status failure 和业务 code failure 必须继续区分。
- 上游错误摘要必须脱敏，且 raw body 默认不进入 error details；如需保留诊断信息，只保留 status、body length、
  上游业务 code、截断且脱敏后的 snippet。
- 本地安装验证过程中生成的 `services/package-lock.json`、`services/node_modules/` 或 packed artifact 必须保持
  ignored，不作为交付内容。

## 测试、质量门禁和验收标准

依赖统一升级后至少通过：

```bash
cd services && npm run validate
cd services && npm test
cd services && npm run pack:check
```

每个发生源码 helper 重构的 service 必须通过：

```bash
cd services && npm run validate -- --service-dir <service-dir>
cd services && npm test -- --service-dir <service-dir>
cd services && npm test -- --coverage --service-dir <service-dir>
```

当重构覆盖 dispatcher、root wrapper、package import、SDK runtime 使用方式或大范围 service runtime 行为时，还必须通过：

```bash
task build
cd services && npm run import:check -- --octobus ../bin/octobus
```

当改动影响 Go runtime、package import、routing protocol、supervision 或 CLI 时，还必须按 harness 运行：

```bash
task lint
task test
task build
go test ./tests/e2e -count=1
```

验收标准：

- `rg '"@chaitin-ai/octobus-sdk": "\\^0\\.5\\.0"' services` 无结果。
- `npm view @chaitin-ai/octobus-sdk@latest version` 返回 `0.6.0` 或兼容的后续 0.6 patch/minor；package 依赖仍固定为
  `^0.6.0`，不使用 `latest`。
- `services/package.json` 根 `bundledDependencies` 仍覆盖运行时需要的直接依赖。
- 没有新增跟踪的 `services/package-lock.json`、`node_modules`、日志、`.env`、service artifact 或真实 secret。
- 被重构 service 的既有测试和 coverage 门禁通过，错误码、错误摘要和上游 mock 断言保持稳定。

## 首版不做事项

- 不把 `examples/*` 的 SDK 依赖版本纳入本次 services spec；示例可作为后续独立变更。
- 不发布 `@chaitin-ai/octobus-tentacles` 到 npm；`services/` 继续 private。
- 不迁移 `services/scripts/validate-service-package.mjs` 到 SDK `multi validate`，也不生成新的 dispatcher 工具。
- 不修改 SDK 源码或发布新的 SDK 版本。
- 不删除 service root 的 `undici` 直接依赖，除非对应源码已不再直接 import `undici` 且 service 级测试证明可移除。
- 不批量替换会改变语义的 `mapHttpStatusToCode`、`httpStatusError`、`readResponseJson` 或 protobuf `toValue`
  手写转换。
- 不改变 proto、schema、bin、service name、handler key、runtime mode 或上游业务字段。

## 关键假设和已确认决策

- 用户目标是升级 `services/` 下 service package 的 SDK 依赖，并利用 0.6.0 helper 简化既有实现。
- 采用分阶段策略：依赖统一升级优先，低风险 helper 收敛其次，服务特化错误语义逐个处理。
- 依赖版本使用 `^0.6.0`，符合 SDK README 对 service package 使用 semver range 的建议。
- 0.6.0 helper 是可选复用层，不拥有 service 的上游业务语义；service README、proto、schema 和测试仍是业务行为真相。
- 若后续 npm `latest` 指向 0.6.x 之后的版本，本 spec 仍以 `^0.6.0` 为目标，不自动升级到新的 major 或 minor 策略。
