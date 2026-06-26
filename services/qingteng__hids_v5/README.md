# 青藤深睿 HIDS V5 OctoBus 服务包

这是一个用于接入 **青藤深睿云工作负载安全平台 V5（HIDS/CWPP）** 的 OctoBus Node.js 服务包，基于 `青藤深睿OpenAPI接口文档_v5.1.5_默认开放版.md` 分析实现，目标设备版本为 v5.1.5.4。

当前版本只提供只读查询能力，不暴露任何处置、删除、隔离、阻断类接口。

## 能力范围

已实现的 RPC 方法：

**主机资产**

- `qingteng.hids.v5.QingtengHIDSService/ListHosts`
- `qingteng.hids.v5.QingtengHIDSService/GetHost`
- `qingteng.hids.v5.QingtengHIDSService/CountHosts`

**Agent**

- `qingteng.hids.v5.QingtengHIDSService/ListAgents`
- `qingteng.hids.v5.QingtengHIDSService/CountAgents`

**入侵检测**

- `qingteng.hids.v5.QingtengHIDSService/ListDetections`
- `qingteng.hids.v5.QingtengHIDSService/GetDetection`

**响应结果查询**

- `qingteng.hids.v5.QingtengHIDSService/ListResponseResults`
- `qingteng.hids.v5.QingtengHIDSService/ListResponseHistory`
- `qingteng.hids.v5.QingtengHIDSService/GetElementOperationInfos`

**基线检查**

- `qingteng.hids.v5.QingtengHIDSService/ListBaselines`
- `qingteng.hids.v5.QingtengHIDSService/GetBaseline`
- `qingteng.hids.v5.QingtengHIDSService/ListBaselineTasks`
- `qingteng.hids.v5.QingtengHIDSService/GetBaselineTaskStatus`
- `qingteng.hids.v5.QingtengHIDSService/ListBaselineTaskResults`

未实现的能力包括但不限于：主机隔离、进程查杀、文件隔离/删除、网络阻断、账号禁用等写入或处置动作。

## 目录结构

- `service.json`：OctoBus 服务清单。
- `package.json`：Node.js 包定义和运行入口。
- `config.schema.json`：实例配置 schema。
- `secret.schema.json`：实例密钥 schema。
- `proto/qingteng_hids_v5.proto`：gRPC API 定义。
- `bin/qingteng-hids-v5.js`：OctoBus 托管时执行的入口。
- `src/qingteng-hids-v5.js`：核心接口适配实现。
- `src/service.js`：OctoBus SDK 服务包装。
- `test/qingteng-hids-v5.test.js`：Node 单元测试。
- `test/mock_upstream.js`：本地 mock 青藤 OpenAPI 服务。

## 配置说明

实例配置使用 `baseUrl` 指向青藤 HIDS 平台地址：

```json
{
  "baseUrl": "https://hids.example.com",
  "timeoutMs": 10000,
  "verifyTLS": true
}
```

支持的地址别名：

- `baseUrl`
- `base_url`
- `host`
- `endpoint`

如果内网环境使用自签名证书，可以关闭 TLS 校验：

```json
{
  "baseUrl": "https://hids.internal.local",
  "timeoutMs": 10000,
  "verifyTLS": false
}
```

或者：

```json
{
  "baseUrl": "https://hids.internal.local",
  "skipTlsVerify": true
}
```

密钥配置使用青藤 OpenAPI Token：

```json
{
  "token": "your-openapi-token"
}
```

请求时服务会自动添加：

```http
Authorization: Bearer your-openapi-token
Content-Type: application/json
```

## 通过 OctoBus 启动

在仓库根目录编译 OctoBus：

```bash
task build
```

启动 OctoBus daemon：

```bash
./bin/octobus serve --data-dir .octobus --addr 127.0.0.1:9000
```

另开一个终端导入服务包：

```bash
./bin/octobus service import qingteng-hids-v5 ./services/qingteng__hids_v5
```

创建真实设备实例：

```bash
./bin/octobus instance create \
  qingteng-prod \
  --service qingteng-hids-v5 \
  --config-json '{"baseUrl":"https://你的青藤平台地址","timeoutMs":10000,"verifyTLS":false}' \
  --secret-json '{"token":"你的OpenAPI Token"}'
```

创建 capset 并暴露实例能力：

```bash
./bin/octobus capset create qingteng --name QingtengHIDS

./bin/octobus capset add-instance \
  qingteng \
  qingteng-prod
```

查看已暴露的方法：

```bash
./bin/octobus catalog qingteng --all --json
```

## 调用示例

查询主机列表：

```bash
curl -X POST \
  http://127.0.0.1:9000/capsets/qingteng/connect/qingteng-prod/qingteng.hids.v5.QingtengHIDSService/ListHosts \
  -H 'Content-Type: application/json' \
  -d '{"page":{"page":0,"size":10},"query":{}}'
```

按 IP 模糊查询主机：

```bash
curl -X POST \
  http://127.0.0.1:9000/capsets/qingteng/connect/qingteng-prod/qingteng.hids.v5.QingtengHIDSService/ListHosts \
  -H 'Content-Type: application/json' \
  -d '{"page":{"page":0,"size":10},"query":{"ipLike":"10.0"}}'
```

查询入侵检测列表：

```bash
curl -X POST \
  http://127.0.0.1:9000/capsets/qingteng/connect/qingteng-prod/qingteng.hids.v5.QingtengHIDSService/ListDetections \
  -H 'Content-Type: application/json' \
  -d '{"page":{"page":0,"size":10},"query":{},"showDetail":true}'
```

按检测 ID 查询单条检测：

```bash
curl -X POST \
  http://127.0.0.1:9000/capsets/qingteng/connect/qingteng-prod/qingteng.hids.v5.QingtengHIDSService/GetDetection \
  -H 'Content-Type: application/json' \
  -d '{"detectionId":"det-001"}'
```

查询响应结果：

```bash
curl -X POST \
  http://127.0.0.1:9000/capsets/qingteng/connect/qingteng-prod/qingteng.hids.v5.QingtengHIDSService/ListResponseResults \
  -H 'Content-Type: application/json' \
  -d '{"page":{"page":0,"size":10},"query":{}}'
```

查询基线列表：

```bash
curl -X POST \
  http://127.0.0.1:9000/capsets/qingteng/connect/qingteng-prod/qingteng.hids.v5.QingtengHIDSService/ListBaselines \
  -H 'Content-Type: application/json' \
  -d '{"page":{"page":0,"size":10},"query":{}}'
```

## 使用本地 Mock 验证

如果暂时没有真实青藤设备，可以先启动 mock 服务：

```bash
node services/qingteng__hids_v5/test/mock_upstream.js
```

默认监听：

- 地址：`http://127.0.0.1:18083`
- Token：`test-token-abc123`

可以用环境变量修改：

```bash
HTTP_PORT=19083 MOCK_TOKEN=dev-token node services/qingteng__hids_v5/test/mock_upstream.js
```

导入服务包后，创建 mock 实例：

```bash
./bin/octobus instance create \
  qingteng-mock \
  --service qingteng-hids-v5 \
  --config-json '{"baseUrl":"http://127.0.0.1:18083","timeoutMs":10000}' \
  --secret-json '{"token":"test-token-abc123"}'
```

创建 mock capset：

```bash
./bin/octobus capset create qingteng-mock --name QingtengMock

./bin/octobus capset add-instance \
  qingteng-mock \
  qingteng-mock
```

调用 mock 主机列表：

```bash
curl -X POST \
  http://127.0.0.1:9000/capsets/qingteng-mock/connect/qingteng-mock/qingteng.hids.v5.QingtengHIDSService/ListHosts \
  -H 'Content-Type: application/json' \
  -d '{"page":{"page":0,"size":10},"query":{}}'
```

## 查询参数扩展

每类查询都提供了一些常用字段，例如：

- 主机：`nameLike`、`ipLike`、`agentIds`、`agentStatus`、`groupIds`、`osTypes`
- Agent：`agentId`、`agentIds`、`status`、`hostname`、`ip`、`version`、`runMode`
- 检测：`startTime`、`endTime`、`severities`、`statuses`、`detectionTypes`、`agentId`、`hostIp`、`hostname`
- 响应结果：`operationMethods`、`operationTypes`、`operationStatuses`、`elementType`、`hostIp`、`operator`
- 基线：`nameLike`、`categoryIds`、`platformLike`、`appNameLike`

如果青藤接口文档中存在暂未显式建模的查询字段，可以通过 `rawQueryJson` 透传：

```bash
curl -X POST \
  http://127.0.0.1:9000/capsets/qingteng/connect/qingteng-prod/qingteng.hids.v5.QingtengHIDSService/ListHosts \
  -H 'Content-Type: application/json' \
  -d '{"page":{"page":0,"size":10},"query":{"rawQueryJson":"{\"custom_field\":\"custom_value\"}"}}'
```

## 错误处理

- HTTP `401` / `403` 映射为 `PERMISSION_DENIED`。
- HTTP `404` 映射为 `NOT_FOUND`。
- HTTP `5xx` 或网络错误映射为 `UNAVAILABLE`。
- 非 JSON 响应映射为 `UNKNOWN`。
- `GetDetection` 查不到数据时返回 `NOT_FOUND`。

所有正常响应都会带有 `raw` 字段，包含：

- `http_status`
- `raw_body`
- `raw_json`

这便于排查青藤侧原始响应结构和字段差异。

## 测试

首次运行测试前，需要让服务目录能解析本地 SDK 依赖。正常通过 OctoBus 导入时会自动安装生产依赖；本地直接跑测试时可以先安装依赖。

示例：

```bash
task sdk:build

tmpdir="$(mktemp -d)"
sdk_tgz="$(cd sdk && npm pack --pack-destination "$tmpdir" --silent)"

cd services/qingteng__hids_v5
npm install --no-save --package-lock=false "$tmpdir/$sdk_tgz"
node --test test/qingteng-hids-v5.test.js
```

已验证测试覆盖：

- 配置和密钥校验。
- Bearer Token 请求头。
- URL 和 HTTP 方法映射。
- 主机、Agent、检测、响应结果、基线数据映射。
- `rawQueryJson` 和 `rawQuery` 查询透传。
- HTTP 错误和非 JSON 响应处理。
- 15 个 RPC handler 完整暴露。

## 常用排错命令

```bash
./bin/octobus status
./bin/octobus service list
./bin/octobus instance list
./bin/octobus instance get qingteng-prod --json
./bin/octobus logs --instance qingteng-prod --limit 200
./bin/octobus logs --service qingteng-hids-v5 --limit 200
```

如果实例启动失败，优先检查：

- `baseUrl` 是否能从 OctoBus 所在机器访问。
- `token` 是否正确，是否具有 OpenAPI 查询权限。
- 青藤平台证书是否需要 `verifyTLS:false` 或 `skipTlsVerify:true`。
- 导入服务时是否成功安装了 `@chaitin-ai/octobus-sdk`。
