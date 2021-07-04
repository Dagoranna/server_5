const WebSocket = require('ws');
const PORT = process.env.PORT || 80;
const wss = new WebSocket.Server({ port: PORT });
const clients = new Set();
const clientsData = new Map();

//функция полидайс
function polydice(dice,diceNumber){
	let rolls='';
	for(let i = 1; i <= diceNumber; i++){
		rolls = rolls + '|' + Math.round(Math.random() * (dice - 1) + 1);
	}	
	return rolls;
}
	
wss.on('connection', ws => {
	clients.add(ws);
	wss.clients.forEach(function each(client) {
		client.send('new client added. ' + wss.clients.size + ' active connections');
		//client.send(ws);
	});	
		
	ws.on('message', message => {
		let answer;
		//answer возвращает исходное сообщение, добавляя к нему результаты бросков через '|'
		//например: dice|23452|Icy|20|2|15|18
		let messageArr = message.split('|'); 
		clientsData.set(ws,messageArr[1]);
		
		if (messageArr[0] == 'dice'){
			//бросок с полидайса; message состоит из запрашиваемой функции, айди игры, имени игрока, типа кубика, кол-ва бросков
			//например: dice|23452|Icy|20|2			
			answer = message + polydice(messageArr[3],messageArr[4]);
			wss.clients.forEach(function each(client) {
				if (clientsData.get(ws) == clientsData.get(client)){
					client.send(answer);
				}
			});			
		} else if (messageArr[0] == 'dicehp'){
			//бросок с полидайса на наброску хп;
			//message состоит из запрашиваемой функции, айди игры, имени игрока, типа кубика, кол-ва бросков
			//например: dicehp|23452|Icy|12|4			
			answer = message + polydice(messageArr[3],messageArr[4]*2);
			wss.clients.forEach(function each(client) {
				if (clientsData.get(ws) == clientsData.get(client)){
					client.send(answer);
				}
			});				
		} else if (messageArr[0] == 'skill'){
			//бросок скила; message состоит из запрашиваемой функции, айди игры, имени игрока, названия скила, бонуса скила
			//например: skill|23452|Icy|Decipher Script|18
			answer = message + polydice(20,1);
			wss.clients.forEach(function each(client) {
				if (clientsData.get(ws) == clientsData.get(client)){
					client.send(answer);
				}
			});				
		}
	});
	
	
	ws.on('close', function(e) {
		clients.delete(ws);
		wss.clients.forEach(function each(client) {
			client.send('client disconnected. ' + wss.clients.size + ' active connections');
		});			
	});	
	
	ws.send('server_awakened');
})

