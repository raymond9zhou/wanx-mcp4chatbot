import axios from "axios";
import config from "./config.js";

// 创建文生图任务
export const createImageTask = async ({
  prompt = "",
  negative_prompt = "",
  model = config.api.defaultModel,
  size = "1024*1024",
  n = 1,
  seed = 0,
  prompt_extend = true,
  watermark = false,
}) => {
  try {
    const apiKey = config.api.apiKey;

    if (!apiKey) {
      throw new Error("API key is not configured");
    }

    // 构建请求体
    const requestBody = {
      model,
      input: {
        prompt,
        negative_prompt,
      },
      parameters: {
        size,
        n,
        seed,
        prompt_extend,
        watermark,
      },
    };

    // 添加可选参数
    if (negative_prompt) {
      requestBody.input.negative_prompt = negative_prompt;
    }

    if (watermark !== null) {
      requestBody.parameters.watermark = watermark;
    }

    // 发送请求
    const response = await axios.post(
      `${config.api.baseUrl}/services/aigc/text2image/image-synthesis`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-DashScope-Async": "enable",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || "Failed to create task");
    }
    throw error;
  }
};

// 获取任务状态
export const getTaskStatus = async (taskId: string) => {
  try {
    const apiKey = config.api.apiKey;

    if (!apiKey) {
      throw new Error("API key is not configured");
    }

    const response = await axios.get(`${config.api.baseUrl}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to get task status"
      );
    }
    throw error;
  }
};

// 轮询任务状态直到完成
export const pollTaskUntilDone = async (taskId: string) => {
  let retries = 0;

  while (retries < config.maxRetries) {
    const taskData = await getTaskStatus(taskId);
    const status = taskData.output.task_status;

    if (status === "SUCCEEDED" || status === "FAILED") {
      return taskData;
    }

    // 等待一段时间后再次查询
    await new Promise((resolve) => setTimeout(resolve, config.pollingInterval));
    retries++;
  }

  throw new Error("Task polling timeout");
};
