## 查询任务结果

### 请求

* **URL**: `GET https://dashscope.aliyuncs.com/api/v1/tasks/<task_id>`
* **Headers**:

  * `Authorization: Bearer <Your_API_Key>`

### 响应示例

```json
{
  "status_code": 200,
  "request_id": "9d634fda-5fe9-9968-a908-xxxxxx",
  "code": null,
  "message": "",
  "output": {
    "task_id": "d35658e4-483f-453b-b8dc-xxxxxx",
    "task_status": "SUCCEEDED",
    "results": [{
      "url": "https://dashscope-result-wlcb.oss-cn-wulanchabu.aliyuncs.com/1.png",
      "orig_prompt": "一间有着精致窗户的花店，漂亮的木质门，摆放着花朵",
      "actual_prompt": "一间精致的花店，窗户上装饰着优雅的雕花，漂亮的木质门上挂着铜制把手。店内摆放着各种色彩鲜艳的花朵，如玫瑰、郁金香和百合等。背景是温馨的室内场景，光线柔和，营造出宁静舒适的氛围。高清写实摄影，近景中心构图。"
    }],
    "submit_time": "2025-01-08 19:36:01.521",
    "scheduled_time": "2025-01-08 19:36:01.542",
    "end_time": "2025-01-08 19:36:13.270",
    "task_metrics": {
      "TOTAL": 1,
      "SUCCEEDED": 1,
      "FAILED": 0
    }
  },
  "usage": {
    "image_count": 1
  }
}
```