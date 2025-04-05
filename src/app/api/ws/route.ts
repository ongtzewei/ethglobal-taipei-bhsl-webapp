import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { fatherAgent, motherAgent, sisterAgent, brotherAgent } from '@/agents';

export function SOCKET(client: WebSocket, request: IncomingMessage, server: WebSocketServer) {
  client.on('message', async function message(data, isBinary) {
    const messageText = isBinary ? data.toString() : data.toString();
    console.log('Received message:', messageText);

    try {
      // Get responses from all agents in sequence, with each agent responding to previous messages
      const agents = [motherAgent, fatherAgent, sisterAgent, brotherAgent];
      let conversationHistory = `User: ${messageText}\n\n`;

      for (const agent of agents) {
        // Add conversation history to the message
        const agentMessage = `${conversationHistory}Please respond to the user's message and any previous responses in the conversation.`;

        const agentResponse = await agent.execute(agentMessage);

        // Send the response
        client.send(
          JSON.stringify({
            senderRole: agent.role,
            senderName: agent.name,
            message: agentResponse,
          }),
        );

        // Add the response to conversation history
        conversationHistory += `${agent.name}: ${agentResponse}\n\n`;
      }
    } catch (error) {
      console.error('Error processing message:', error);
      client.send(
        JSON.stringify({
          senderRole: motherAgent.role,
          senderName: motherAgent.name,
          message: '系統好像有點問題，讓我檢查一下。',
        }),
      );
    }
  });

  client.on('close', function close(code, data) {
    const reason = data.toString();
    console.log(`A client disconnected. Reason: ${reason}`);
  });
}
