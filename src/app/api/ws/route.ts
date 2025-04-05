import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { fatherAgent, motherAgent } from "@/agents";


export function SOCKET(
  client: WebSocket,
  request: IncomingMessage,
  server: WebSocketServer,
) {
  client.on('message', async function message(data, isBinary) {
    const messageText = isBinary ? data.toString() : data.toString();
    console.log('Received message:', messageText);

    try {
      // Get responses from both agents
      const [motherResponse, fatherResponse] = await Promise.all([
        motherAgent.execute(messageText),
        fatherAgent.execute(messageText)
      ]);

      // Send mother's response
      const motherReply = JSON.stringify({
        sender: 'mother',
        message: motherResponse,
      });
      client.send(motherReply);

      // Send father's response
      const fatherReply = JSON.stringify({
        sender: 'father',
        message: fatherResponse,
      });
      client.send(fatherReply);
    } catch (error) {
      console.error('Error processing message:', error);
      // Send error messages from both agents
      client.send(JSON.stringify({
        sender: 'mother',
        message: '哎喲，出問題了！讓我休息一下再試試看。',
      }));
      client.send(JSON.stringify({
        sender: 'father',
        message: '要小心，系統出問題了。讓我檢查一下再試試看。',
      }));
    }
  });

  client.on('close', function close(code, data) {
    const reason = data.toString();
    console.log(`A client disconnected. Reason: ${reason}`);
  });
}
