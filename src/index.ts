#!/usr/bin/env node

import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
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
  { task_id: z.string() },
  async ({ task_id }) => {
    const result = await pollTaskUntilDone(task_id);
    return {
      content: [{ type: "text", text: JSON.stringify(result.output.results) }],
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

