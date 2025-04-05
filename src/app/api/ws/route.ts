export function SOCKET(
  client: import('ws').WebSocket,
  request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer,
) {
  client.on('message', function message(data, isBinary) {
    const message = isBinary ? data : data.toString();
    console.log('Received message:', message);
    const reply = JSON.stringify({
      sender: 'mother',
      message: 'hello',
    });
    client.send(reply);
  });

  client.on('close', function close(code, data) {
    const reason = data.toString();
    console.log(`A client disconnected. Reason: ${reason}`);
  });
}
