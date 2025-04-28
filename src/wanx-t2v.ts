import axios from 'axios';
import config from './config.js';

/**  
 * 调用通义万相2.1文生视频API生成视频  
 * @param {string} prompt - 文本描述
 * @returns {Promise<string>} - 成功返回视频URL，失败返回错误信息  
 */  
export async function generateVideo(prompt: string) {  
  const apiKey = config.api.apiKey;
  const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis'; 
  const headers = {  
    'X-DashScope-Async': 'enable',
    'Authorization': `Bearer ${apiKey}`,  
    'Content-Type': 'application/json'  
  };  
  const payload = {  
    model: 'wanx2.1-t2v-turbo',  
    input: { prompt },
    parameters: {
      size: '832*480',
      duration: 5,
      prompt_extend: true,
    },
  };

  try {  
    const res = await axios.post(url, payload, { headers });  
    const taskId = res.data?.output?.task_id;  
    if (taskId) return taskId;  
    // 如果响应里没有task_id，说明有错误  
    throw res.data;  
  } catch (err: any) {  
    // err.response?.data 可能含详细错误  
    throw err.response?.data || err.message;  
  }  
}  

/**  
 * 步骤二：查询视频生成任务状态（可用作轮询）  
 * @param {string} taskId - 第一步拿到的 task_id  
 * @param {string} apiKey - 通义 DASHSCOPE_API_KEY  
 * @returns {Promise<object>} - 包含任务状态信息的对象  
 */  
export async function queryVideoTaskStatus(taskId: string) {
  const apiKey = config.api.apiKey;
  const url = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;  
  const headers = {  
    'Authorization': `Bearer ${apiKey}`  
  };  
  let videoUrl = null;
  let retries = 0;
  const maxRetries = config.maxRetries; // 从配置文件中获取最大重试次数
  const pollingInterval = config.pollingInterval; // 从配置文件中获取轮询间隔

  while (retries < maxRetries) {
    try {
      const res = await axios.get(url, { headers });
      // res.data.output.task_status 可能为 INITIAL, RUNNING, SUCCEEDED, FAILED, CANCELLED  
      // res.data.output.video_url 只有在 SUCCEEDED 时有值  
      if (res.data.output.task_status === 'SUCCEEDED') {
        videoUrl = res.data.output.video_url;
        break; // 如果状态为 SUCCEEDED，则跳出循环
      } else if (res.data.output.task_status === 'FAILED' || res.data.output.task_status === 'CANCELLED') {
        throw res.data.output.task_status; // 如果状态为 FAILED 或 CANCELLED，则抛出错误
      }
      // 如果状态不是 SUCCEEDED，则等待一段时间后继续轮询
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      retries++;
    } catch (err: any) {
      throw err.response?.data || err.message;  
    }
  }

  if (!videoUrl) {
    throw new Error('视频生成任务超时或失败');
  }

  return videoUrl;
}