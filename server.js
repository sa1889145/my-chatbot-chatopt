import express from 'express';
import cors from 'cors';
import { generate } from './fronted/chatbot.js';

const app = express()
const port = 3001;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to CHATOPT!')
});

app.post('/chat', async (req, res) => {
  // Handle the ask request here
  const { message, threadId } = req.body;
  //todo: validate above fields
  //res.send('Received your question!');
if(!message || !threadId) {
     res.status(400).json({ message: 'Missing required fields: message and threadId' });
     return;
  }

  console.log('Message', message); 

  const result = await generate(message, threadId); 
  // Call the generate function with the message
  
  res.json({ message: result });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
});