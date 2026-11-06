import readline from 'node:readline/promises';

import OpenAI from "openai";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY,
          baseURL: "https://api.tavily.com/v1" });


const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const cache = new NodeCache({ stdTTL: 3600 * 24 }); // Cache with a TTL of 24 hour


export async function generate(userMessage, threadId) {

   

    const baseMessages= [
        {
            role: "system",
            content: `You are a smart personal assistant.
            If you know the answer to a question, answer it directly in plain English.
            If the answer requires real - time ,local , or , up-to-date information, or if you don't know the answer, use the available toolss to find it.
            you have access to the following tool:
            webSearch(query: string): use this to search the internet for current information.
            Decide when to use your own knowledge and when to use the tool.
            do not mention the tool unless needed.
            example:
            Q: what is the capital of india?
            A: The capital of India is New Delhi.

            q: what is the current weather in delhi capital of india ?
            A: (use the search tool to find the latest weather).

            Q: who is the prime minister of india?
            A: The current Prime Minister of India is Narendra Modi.

            Q: Tell me the latest news about the stock market.
            A: (use the search tool to find the latest news about the stock market).
            
            current date and time:  ${new Date().toUTCString()}.`
        },
       // {
         //   role: "user",
        //    content: "what is the current weather in delhi capital of india ?" 
            //"Who is the richest men in the world in 2026?."
        //}
    ];

    const messages = cache.get(threadId) ?? baseMessages;


      
      messages.push({ role: "user", content: userMessage });
    
      const MAX_RETRIES = 5;
      let count = 0;

   while(true) {

    if (count > MAX_RETRIES) {
      return "i could not find the answer to your question after multiple attempts. Please try again later.";
    }
    count++;
     

    const completions = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
       
        temperature: 1,
        messages: messages,

        tools: [
     
  {
      "type": "function",
      "function": {
        "name": "webSearch",
        "description": "Search the web for realtime information on the internet.",
        "parameters": {
          // JSON Schema object
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "The search query"
            }
          },
          "required": ["query"]
        }
      }
    }
  ],
  tool_choice: "auto",
        
    });
 
    messages.push(completions.choices[0].message);

    const toolCalls = completions.choices[0].message.tool_calls;

    if (!toolCalls) {
       //here we end the chatbot response
       cache.set(threadId, messages); // Cache the updated messages for the thread
        
       return completions.choices[0].message.content; // Return the response content if no tool calls are present
      }

   for (const tool of toolCalls) {
        //console.log(`tool: `, tool);
        const functionName = tool.function.name;
        const functionParams = tool.function.arguments;

        if (functionName === "webSearch") {
          const toolResult = await webSearch(JSON.parse(functionParams));
          

          messages.push({
            role: "tool",
            tool_call_id: tool.id,
            name: functionName,
            content: toolResult,
          });   
        
      }
    }
  
    }

}

 async function webSearch({query}) {

   //here we will do tavily api call
   console.log(`calling web search...`); 

   const response = await tvly.search(query,{max_results: 1}); //max_results: 1 to get only the top result dega from output of tavily api call
   

   const finalResult = response.results.map((result) => result.content).join("\n\n");
   console.log("Final Result: ", finalResult);

   return finalResult;

}