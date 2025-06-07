#!/usr/bin/env node

import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import { createImageTask, pollTaskUntilDone } from "./wanx-t2i.js";
import { generateVideo, queryVideoTaskStatus } from "./wanx-t2v.js";
import config from "./config.js";

// 检查API密钥是否配置
if (!config.api.apiKey) {
  console.error("DASHSCOPE_API_KEY is not configured");
  process.exit(1);
}

// 创建MCP服务器
const server = new McpServer({
  name: "tongyi-wanxiang",
  version: "v1.0.3",
});

server.tool(
  "wanx-t2i-image-generation",
  "使用阿里云万相文生图大模型的文生图能力，由于图片生成耗时比较久，需要调用 wanx-t2i-image-generation-result 工具获取结果",
  { prompt: z.string(), negative_prompt: z.string(), seed: z.number().optional() },
  async ({ prompt, negative_prompt, seed }) => {
    const result = await createImageTask({
      prompt,
      negative_prompt,
      seed: seed ?? Math.floor(Math.random() * (4294967291 - 0)),
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result.output) }],
    };
  }
);

server.tool(
  "wanx-t2i-image-generation-result",
  "获取阿里云万相文生图大模型的文生图结果",
  { task_id: z.string(), encoded: z.boolean().optional() },
  async ({ task_id, encoded = false }) => {
    const result = await pollTaskUntilDone(task_id);
    const results = result.output.results;
    
    if (!results || results.length === 0) {
      return {
        content: [{ type: "text" as const, text: "没有找到生成的图片结果" }],
      };
    }

    const contentItems: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [];
    
    for (let i = 0; i < results.length; i++) {
      const imageResult = results[i];
      const imageUrl = imageResult.url;
      
      if (!imageUrl) {
        contentItems.push({
          type: "text" as const,
          text: `图片 ${i + 1}: 没有找到图片URL`,
        });
        continue;
      }

      try {
        // 获取图片数据
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000, // 30秒超时
        });
        
        // 转换为base64
        const imageBuffer = Buffer.from(imageResponse.data);
        const base64Image = imageBuffer.toString('base64');
        
        // 添加图片信息文本
        contentItems.push({
          type: "text" as const,
          text: `图片 ${i + 1} 已生成 (${imageBuffer.length} bytes)`,
        });
        
        // 根据encoded参数决定返回格式
        if (encoded) {
          contentItems.push({
            type: "text" as const,
            text: `data:image/png;base64,${base64Image}`,
          });
        } else {
          contentItems.push({
            type: "image" as const,
            data: base64Image,
            mimeType: "image/png",
          });
        }
        
        // 如果有原始提示词，也包含进去
        if (imageResult.orig_prompt) {
          contentItems.push({
            type: "text" as const,
            text: `原始提示词: ${imageResult.orig_prompt}`,
          });
        }
        
      } catch (error: any) {
        contentItems.push({
          type: "text" as const,
          text: `图片 ${i + 1} 下载失败: ${error.message}`,
        });
      }
    }

    return {
      content: contentItems,
    };
  }
);

server.tool(
  "wanx-t2v-video-generation",
  "使用阿里云万相文生视频大模型的文生视频能力，由于视频生成耗时比较久，需要调用 wanx-t2v-video-generation-result 工具获取结果",
  { prompt: z.string() },
  async ({ prompt }) => {
    const result = await generateVideo(prompt);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

server.tool(
  "wanx-t2v-video-generation-result",
  "获取阿里云万相文生视频大模型的文生视频结果",
  { task_id: z.string() },
  async ({ task_id }) => {
    const result = await queryVideoTaskStatus(task_id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});

