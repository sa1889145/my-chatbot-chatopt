 const input = document.querySelector("#message-input");
 const chatContainer = document.querySelector("#chat-container");
 const askBtn = document.querySelector("#ask");

 const threadId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9); // Use a default thread ID for now

 input?.addEventListener("keyup", handleEnter)
askBtn?.addEventListener("click", handleAsk)

const loading = document.createElement("div");
loading.className = "my-6 animate-pulse bg-gray-800 p-3 rounded-xl ml-auto max-w-fit";
loading.textContent = "Thinking...";

async function generate(text) {
  
   /** 1. append message to ui
    *  2.send message to LLM
    *  3. append response to ui
    */

   const msg = document.createElement("div");
   msg.className = "my-6 bg-gray-800 p-3 rounded-xl ml-auto max-w-fit";
   msg.textContent = text;
   chatContainer?.appendChild(msg);
   input.value = "";

   chatContainer?.appendChild(loading);

   //call server

   const assistantMessage = await callServer(text);

   const assistantMsgElem = document.createElement("div");
   assistantMsgElem.className = "max-w-fit";
   assistantMsgElem.textContent = assistantMessage;

   loading.remove();
   chatContainer?.appendChild(assistantMsgElem);
   
}
   async function callServer(inputText) {
       const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ threadId: threadId, message: inputText }),
        }); 

        if (!response.ok) {
            throw new Error(`Error generating response.`);
        }

        const result = await response.json();
        return result.message;
   }
   

 async function handleAsk(e) {
     const text = input?.value.trim();
     if(!text) {
         return;
     }
    await generate(text);
 }

 async function handleEnter(e) {
     if (e.key === "Enter") {
         const text = input?.value.trim();
         if(!text) {
              return;
         }


       await generate(text);
     }
    }