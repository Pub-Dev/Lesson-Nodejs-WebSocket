const WebSocket = require('ws');

var playersOn = [];

function onError(ws, err){
	console.error(`onError: ${err.message}`);
}

function onMessage(wss, ws, data) {
	var obj = JSON.parse(data.toString());
	wss.clients.forEach(function each(client){
		if(client === ws && client.readyState === WebSocket.OPEN){
			addPlayer(ws, client, obj);
		}
		if(client !== ws && client.readyState === WebSocket.OPEN){		
			client.send(JSON.stringify(obj));
		}
	});
}

function addPlayer(ws, client, data){
	if(data['action'] === 'ENEMY_INVOCATION') {
		playersOn.push({
			"client": client,
			"id": data['id'],
			"position": data['position'],
			"direction": data['direction'],
		});
	}
}

function onDisconnect(wss, ws) {
	console.log(`onDisconnect`);

	playersOn.forEach(function playersOnMethod(player){
		var validPlayer = false;
		wss.clients.forEach(function each(client){
			if(client === player.client){
				validPlayer = true;
				return;
			}
		});
		if(!validPlayer) {
			wss.clients.forEach(function each(client){
				if(client !== player.client){
					client.send(JSON.stringify({
						"id":player.id,
						"action":"DISCONNECT",
						"direction":"RIGHT",
					}));
				}
			});
			playersOn = playersOn.filter(function(obj){
				return player !== obj;
			});
		}
	});

	
}

function onConnection(wss, ws, req) {
	ws.on('message', data => onMessage(wss, ws, data));
	ws.on('error', error => onError(ws, error));
	ws.on('close', function close() { 
		onDisconnect(wss, ws);
	});

	console.log('onConnection');
}

module.exports = (server) => {
	const wss = new WebSocket.Server({
		server
	});
	wss.on('connection', function conn(ws, req){
		onConnection(wss, ws, req);
	});
	
	console.log('App WebSocket Server is Running!');
	return wss;
}