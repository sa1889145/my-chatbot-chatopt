import readline from 'node:readline/promises';
//import dotenv from "dotenv";
import OpenAI from "openai";
import { tavily } from "@tavily/core";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY,
          baseURL: "https://api.tavily.com/v1" });

//dotenv.config();

//const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

async function main() {

   const rl = readline.createInterface({input: process.stdin, output: process.stdout});

    const messages= [
        {
            role: "system",
            content: `You are a smart personal assistant.
            You have access to one tool:
            webSearch(query: string)
            Use it whenever the user asks for real-time information.
            current date and time:  ${new Date().toUTCString()}.`
        },
       // {
         //   role: "user",
        //    content: "what is the current weather in delhi capital of india ?" 
            //"Who is the richest men in the world in 2026?."
        //}
    ];


   while (true) {
      const question = await rl.question("you: ");
      //bye
      if(question=="bye") {
         break;
      
    }
      messages.push({ role: "user", content: question });
    

   while(true) {
     

    const completions = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        //response_format: { type: "json_object" },
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
       console.log(`Assistant: ${completions.choices[0].message.content}`);
       break;
      }

   for (const tool of toolCalls) {
        //console.log(`tool: `, tool);
        const functionName = tool.function.name;
        const functionParams = tool.function.arguments;

        if (functionName === "webSearch") {
          const toolResult = await webSearch(JSON.parse(functionParams));
          //console.log("Tool Result: ", toolResult);

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
rl.close();
}
main();


 async function webSearch({query}) {

   //here we will do tavily api call
   console.log(`calling web search...`); 

   const response = await tvly.search(query,{max_results: 1}); //max_results: 1 to get only the top result dega from output of tavily api call
   //console.log("Response: ", response);

   const finalResult = response.results.map((result) => result.content).join("\n\n");
   console.log("Final Result: ", finalResult);

   return finalResult;

}