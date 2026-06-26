# 青藤深睿 HIDS V5 OctoBus 插件联调文档

说明：

- 本文档用于 PR 联调证据。
- 所有设备地址、Token、主机 IP、主机名、业务组、告警 ID、基线 ID、任务 ID、人员信息、路径、文件名、进程名、响应数据值均已脱敏。
- `Authorization` 固定展示为 `Bearer ******`。
- 响应体保留字段结构和状态码，不保留任何真实有效数据。
- `<...>` 表示占位值，不可用于实际请求。

## 汇总

| # | 接口 | Connect HTTP | Product HTTP | 结果 | 备注 |
|---:|---|---:|---:|---|---|
| 1 | ListHosts - 查询主机资产列表 | 200 | 200 | OK | 响应内容已脱敏 |
| 2 | GetHost - 查询主机资产详情 | 200 | 200 | OK | 响应内容已脱敏 |
| 3 | CountHosts - 查询主机资产数量 | 200 | 200 | OK | 响应内容已脱敏 |
| 4 | ListAgents - 查询 Agent 列表 | 200 | 200 | OK | 响应内容已脱敏 |
| 5 | CountAgents - 查询 Agent 数量 | 200 | 200 | OK | 响应内容已脱敏 |
| 6 | ListDetections - 查询入侵检测告警列表 | 200 | 200 | OK | 响应内容已脱敏 |
| 7 | GetDetection - 查询单条入侵检测告警 | 200 | 200 | OK | 响应内容已脱敏 |
| 8 | ListResponseResults - 查询响应结果列表 | 200 | 200 | OK | 响应内容已脱敏 |
| 9 | ListResponseHistory - 查询响应操作历史列表 | 200 | 200 | OK | 响应内容已脱敏 |
| 10 | GetElementOperationInfos - 查询元素响应状态信息 | 200 | 200 | OK | 响应内容已脱敏 |
| 11 | ListBaselines - 查询基线列表 | 200 | 200 | OK | 响应内容已脱敏 |
| 12 | GetBaseline - 查询基线详情 | 200 | 200 | OK | 响应内容已脱敏 |
| 13 | ListBaselineTasks - 查询基线任务列表 | 200 | 200 | OK | 响应内容已脱敏 |
| 14 | GetBaselineTaskStatus - 查询基线任务执行状态 | 200 | 200 | OK | 响应内容已脱敏 |
| 15 | ListBaselineTaskResults - 查询基线任务结果 | 503 | 500 | ERROR | 响应内容已脱敏 |

## 1. ListHosts - 查询主机资产列表

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/ListHosts
Content-Type: application/json

{
  "page": {
    "page": 0,
    "size": 1
  },
  "query": {}
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "data": [
    {
      "id": "<HOST_ID>",
      "name": "<HOST_NAME>",
      "main_ip": "<HOST_IP>",
      "agent_id": "<AGENT_ID>",
      "agent_status": "<AGENT_STATUS>",
      "group": {
        "id": "<GROUP_ID>",
        "parent_id": "<PARENT_GROUP_ID>",
        "name": "<GROUP_NAME>",
        "description": "<GROUP_DESCRIPTION>",
        "created_at": "<RFC3339_TIME>",
        "updated_at": "<RFC3339_TIME>"
      },
      "internal_ips": [
        "<INTERNAL_IP>"
      ],
      "external_ips": [
        "<EXTERNAL_IP>"
      ],
      "os": {
        "type": "<OS_TYPE>",
        "arch": "<OS_ARCH>",
        "dist": "<OS_DIST>",
        "version": "<OS_VERSION>",
        "kernel_version": "<KERNEL_VERSION>"
      },
      "location": "<LOCATION>",
      "charger_name": "<CHARGER_NAME>",
      "charger_email": "<CHARGER_EMAIL>",
      "tags": [],
      "first_seen": "<RFC3339_TIME>",
      "last_seen": "<RFC3339_TIME>",
      "hit_ip": "<HIT_IP>",
      "group_relation_name": "<GROUP_RELATION_NAME>",
      "agent_run_mode": "<AGENT_RUN_MODE>",
      "agent_version": "<AGENT_VERSION>",
      "host_type": "<HOST_TYPE>",
      "run_level": "<RUN_LEVEL>",
      "client_ip": "<CLIENT_IP>"
    }
  ],
  "total": "<TOTAL>"
}
```

## 2. GetHost - 查询主机资产详情

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/GetHost
Content-Type: application/json

{
  "id": "<HOST_ID>"
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "id": "<HOST_ID>",
  "name": "<HOST_NAME>",
  "main_ip": "<HOST_IP>",
  "agent_id": "<AGENT_ID>",
  "agent_status": "<AGENT_STATUS>",
  "group": {
    "id": "<GROUP_ID>",
    "name": "<GROUP_NAME>"
  },
  "internal_ips": [
    "<INTERNAL_IP>"
  ],
  "external_ips": [
    "<EXTERNAL_IP>"
  ],
  "os": {
    "type": "<OS_TYPE>",
    "arch": "<OS_ARCH>",
    "dist": "<OS_DIST>",
    "version": "<OS_VERSION>",
    "kernel_version": "<KERNEL_VERSION>"
  },
  "first_seen": "<RFC3339_TIME>",
  "last_seen": "<RFC3339_TIME>",
  "agent_run_mode": "<AGENT_RUN_MODE>",
  "agent_version": "<AGENT_VERSION>",
  "host_type": "<HOST_TYPE>",
  "run_level": "<RUN_LEVEL>",
  "client_ip": "<CLIENT_IP>"
}
```

## 3. CountHosts - 查询主机资产数量

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/CountHosts
Content-Type: application/json

{
  "query": {}
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "total": "<TOTAL_HOSTS>"
}
```

## 4. ListAgents - 查询 Agent 列表

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/ListAgents
Content-Type: application/json

{
  "page": {
    "page": 0,
    "size": 1
  },
  "query": {}
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "data": [
    {
      "agent_id": "<AGENT_ID>",
      "state": "<AGENT_STATE>",
      "run_mode": "<RUN_MODE>",
      "hostname": "<HOST_NAME>",
      "ip": "<HOST_IP>",
      "version": "<AGENT_VERSION>",
      "run_level": "<RUN_LEVEL>",
      "log_level": "<LOG_LEVEL>",
      "created_at": "<RFC3339_TIME>",
      "last_online_at": "<RFC3339_TIME>",
      "last_offline_at": "<RFC3339_TIME>",
      "last_offline_reason": "<OFFLINE_REASON>",
      "driver_state": "<DRIVER_STATE>",
      "driver_run_state": "<DRIVER_RUN_STATE>",
      "os_type": "<OS_TYPE>",
      "os_dist": "<OS_DIST>",
      "os_version": "<OS_VERSION>",
      "os_arch": "<OS_ARCH>",
      "mo_id": "<MO_ID>",
      "connection_type": "<CONNECTION_TYPE>",
      "connection_host": "<CONNECTION_HOST>",
      "proxy_ip": "<PROXY_IP>",
      "license_status": "<LICENSE_STATUS>",
      "host_type": "<HOST_TYPE>"
    }
  ],
  "total": "<TOTAL>"
}
```

## 5. CountAgents - 查询 Agent 数量

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/CountAgents
Content-Type: application/json

{
  "query": {}
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "total": "<TOTAL_AGENTS>"
}
```

## 6. ListDetections - 查询入侵检测告警列表

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/ListDetections
Content-Type: application/json

{
  "page": {
    "page": 0,
    "size": 1
  },
  "query": {},
  "showDetail": true
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "total": "<TOTAL_DETECTIONS>",
  "detections": [
    {
      "base_info": {
        "detection_id": "<DETECTION_ID>",
        "detection_code": "<DETECTION_CODE>",
        "severity": "<SEVERITY>",
        "status": "<DETECTION_STATUS>",
        "detection_type": "<DETECTION_TYPE>",
        "detection_type_code": "<DETECTION_TYPE_CODE>",
        "detection_title": "<DETECTION_TITLE>",
        "detection_time": "<RFC3339_TIME>",
        "last_detection_time": "<RFC3339_TIME>",
        "host_ip": "<HOST_IP>",
        "hostname": "<HOST_NAME>",
        "agent_id": "<AGENT_ID>",
        "group_name": "<GROUP_NAME>",
        "dup_count": "<DUP_COUNT>"
      },
      "detail_info": {
        "handle_suggestion": "<HANDLE_SUGGESTION>",
        "action_desc": "<ACTION_DESCRIPTION>",
        "detection_response_info": {
          "operation_process_element_id": "<PROCESS_ELEMENT_ID>",
          "operation_file_element_id": "<FILE_ELEMENT_ID>"
        }
      }
    }
  ]
}
```

## 7. GetDetection - 查询单条入侵检测告警

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/GetDetection
Content-Type: application/json

{
  "detectionId": "<DETECTION_ID>"
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "total": 1,
  "detections": [
    {
      "base_info": {
        "detection_id": "<DETECTION_ID>",
        "detection_code": "<DETECTION_CODE>",
        "severity": "<SEVERITY>",
        "status": "<DETECTION_STATUS>",
        "detection_type": "<DETECTION_TYPE>",
        "detection_title": "<DETECTION_TITLE>",
        "host_ip": "<HOST_IP>",
        "hostname": "<HOST_NAME>",
        "agent_id": "<AGENT_ID>"
      },
      "detail_info": {
        "handle_suggestion": "<HANDLE_SUGGESTION>",
        "action_desc": "<ACTION_DESCRIPTION>"
      }
    }
  ]
}
```

## 8. ListResponseResults - 查询响应结果列表

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/ListResponseResults
Content-Type: application/json

{
  "page": {
    "page": 0,
    "size": 1
  },
  "query": {
    "operationMethods": [
      "<OPERATION_METHOD>"
    ]
  }
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "data": [
    {
      "result_id": "<RESULT_ID>",
      "element_id": "<ELEMENT_ID>",
      "element_type": "<ELEMENT_TYPE>",
      "agent_id": "<AGENT_ID>",
      "host_id": "<HOST_ID>",
      "host_ip": "<HOST_IP>",
      "hostname": "<HOST_NAME>",
      "group_name": "<GROUP_NAME>",
      "operation_method": "<OPERATION_METHOD>",
      "operation_type": "<OPERATION_TYPE>",
      "operation_status": "<OPERATION_STATUS>",
      "operator": "<OPERATOR>",
      "reason": "<REASON>",
      "error": "<ERROR_MESSAGE>",
      "create_time": "<RFC3339_TIME>",
      "detection_code": "<DETECTION_CODE>",
      "detection_id": "<DETECTION_ID>",
      "source": "<SOURCE>"
    }
  ],
  "total": "<TOTAL>"
}
```

## 9. ListResponseHistory - 查询响应操作历史列表

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/ListResponseHistory
Content-Type: application/json

{
  "page": {
    "page": 0,
    "size": 1
  },
  "query": {
    "elementType": "<ELEMENT_TYPE>"
  }
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "data": [
    {
      "history_id": "<HISTORY_ID>",
      "element_id": "<ELEMENT_ID>",
      "element_type": "<ELEMENT_TYPE>",
      "agent_id": "<AGENT_ID>",
      "host_id": "<HOST_ID>",
      "host_ip": "<HOST_IP>",
      "hostname": "<HOST_NAME>",
      "group_name": "<GROUP_NAME>",
      "operation_method": "<OPERATION_METHOD>",
      "operation_type": "<OPERATION_TYPE>",
      "operation_status": "<OPERATION_STATUS>",
      "operator": "<OPERATOR>",
      "reason": "<REASON>",
      "error": "<ERROR_MESSAGE>",
      "create_time": "<RFC3339_TIME>",
      "detection_code": "<DETECTION_CODE>",
      "detection_id": "<DETECTION_ID>",
      "source": "<SOURCE>"
    }
  ],
  "total": "<TOTAL>"
}
```

## 10. GetElementOperationInfos - 查询元素响应状态信息

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/GetElementOperationInfos
Content-Type: application/json

{
  "elementIds": [
    "<ELEMENT_ID>"
  ],
  "elementType": "<ELEMENT_TYPE>",
  "detectionCode": "<DETECTION_CODE>",
  "showDetail": true
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "data": [
    {
      "result_id": "<RESULT_ID>",
      "element_id": "<ELEMENT_ID>",
      "element_type": "<ELEMENT_TYPE>",
      "operation_method": "<OPERATION_METHOD>",
      "operation_status": "<OPERATION_STATUS>",
      "error": "<ERROR_MESSAGE>"
    }
  ],
  "total": "<TOTAL>"
}
```

## 11. ListBaselines - 查询基线列表

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/ListBaselines
Content-Type: application/json

{
  "page": {
    "page": 0,
    "size": 1
  },
  "query": {
    "rawQueryJson": "{\"is_builtin\":true}"
  }
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "data": [
    {
      "uuid": "<BASELINE_ID>",
      "name": "<BASELINE_NAME>",
      "category_id": "<CATEGORY_ID>",
      "category": "<CATEGORY_NAME>",
      "cpu_arch": "<CPU_ARCH>",
      "active": "<ACTIVE>",
      "created_at": "<RFC3339_TIME>",
      "updated_at": "<RFC3339_TIME>",
      "check_item_ids": [
        "<CHECK_ITEM_ID>"
      ]
    }
  ],
  "total": "<TOTAL>"
}
```

## 12. GetBaseline - 查询基线详情

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/GetBaseline
Content-Type: application/json

{
  "baselineId": "<BASELINE_ID>"
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "uuid": "<BASELINE_ID>",
  "name": "<BASELINE_NAME>",
  "category_id": "<CATEGORY_ID>",
  "category": "<CATEGORY_NAME>",
  "cpu_arch": "<CPU_ARCH>",
  "active": "<ACTIVE>",
  "created_at": "<RFC3339_TIME>",
  "updated_at": "<RFC3339_TIME>",
  "check_item_ids": [
    "<CHECK_ITEM_ID>"
  ],
  "platforms": [
    {
      "id": "<PLATFORM_ID>",
      "name": "<PLATFORM_NAME>"
    }
  ]
}
```

## 13. ListBaselineTasks - 查询基线任务列表

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/ListBaselineTasks
Content-Type: application/json

{
  "page": {
    "page": 0,
    "size": 1
  },
  "query": {}
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "baseline_task": [
    {
      "task_id": "<TASK_ID>",
      "name": "<TASK_NAME>",
      "baseline_name": [
        "<BASELINE_NAME>"
      ],
      "passed": "<PASSED_RATE>",
      "last_executed_at": "<RFC3339_TIME>",
      "next_executed_at": "<RFC3339_TIME>",
      "created_at": "<RFC3339_TIME>",
      "is_executing": "<IS_EXECUTING>",
      "cron": "<CRON_EXPR>",
      "editable": "<EDITABLE>"
    }
  ],
  "total": "<TOTAL>"
}
```

## 14. GetBaselineTaskStatus - 查询基线任务执行状态

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/GetBaselineTaskStatus
Content-Type: application/json

{
  "taskId": "<TASK_ID>"
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "task_status": [
    {
      "task_id": "<TASK_ID>",
      "is_executing": "<IS_EXECUTING>",
      "last_executed_at": "<RFC3339_TIME>",
      "passed": "<PASSED_RATE>",
      "next_executed_at": "<RFC3339_TIME>",
      "task_status": "<TASK_STATUS>",
      "task_status_description_key": "<TASK_STATUS_DESCRIPTION_KEY>",
      "last_execute_record_id": "<EXECUTE_RECORD_ID>"
    }
  ]
}
```

## 15. ListBaselineTaskResults - 查询基线任务结果

### OctoBus Connect Request
```http
POST <OCTOBUS_BASE_URL>/capsets/<CAPSET_ID>/connect/<INSTANCE_ID>/qingteng.hids.v5.QingtengHIDSService/ListBaselineTaskResults
Content-Type: application/json

{
  "taskId": "<TASK_ID>",
  "baselineId": "<BASELINE_ID>",
  "page": {
    "page": 0,
    "size": 1
  },
  "query": {}
}
```


### Product API Response
```http
HTTP/1.1 200 OK
{
  "results": [
    {
      "uuid": "<TASK_RESULT_ID>",
      "task_id": "<TASK_ID>",
      "baseline_id": "<BASELINE_ID>",
      "execute_record_id": "<EXECUTE_RECORD_ID>",
      "agent_id": "<AGENT_ID>",
      "check_id": "<CHECK_ID>",
      "code": "<CHECK_CODE>",
      "flag": "<CHECK_FLAG>",
      "error": "<ERROR_MESSAGE>",
      "data": "<CHECK_RESULT_DATA>",
      "check_object_id": "<CHECK_OBJECT_ID>",
      "created_at": "<RFC3339_TIME>"
    }
  ]
}
```
