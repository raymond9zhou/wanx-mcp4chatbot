const config = {
  api: {  
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',  
    apiKey: process.env.DASHSCOPE_API_KEY,  
    defaultModel: 'wanx2.1-t2i-turbo'  
  },  
  pollingInterval: 2000, // 轮询间隔（毫秒）  
  maxRetries: 30         // 最大重试次数  
};  

export default config;  