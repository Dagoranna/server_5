const WebSocket = require('ws');
const PORT = process.env.PORT || 80;
const wss = new WebSocket.Server({ port: PORT });
const clients = new Set();
const clientsData = new Map();

//функция полидайс
function polydice(dice,diceNumber){
	let rolls="";
	for(let i = 1; i <= diceNumber; i++){
		rolls = rolls + '|' + Math.round(Math.random() * (dice - 1) + 1);
	}	
	return rolls;
}
	
wss.on('connection', ws => {
	clients.add(ws);
	wss.clients.forEach(function each(client) {
		client.send('new client added. ' + wss.clients.size + ' active connections');
	});	
		
	ws.on('message', message => {
		//возможные варианты message
		/*1. section=dices|gamername=Icy|gamercolor=red|targetname=(d20,d10 etc.)/skill name/save name etc.
		|dice=20,10 etc.|dicecount=3(how many rolls)|dicebonus=addition to roll( 15, -3 etc.)|special=hp/stats/skill (any addition info)|special2 = in reserve */
		/*2. section=map
		тут будет разбор сообщения от карты*/
		
		let answer;
		let inputMessage = new Map();
		
		//разбиваем входящую строку до коллекции ключ/значение
		let messageArr = message.split('|'); 
		messageArr.forEach((item) => {
			let newArr = item.split('=');
			inputMessage.set(newArr[0],newArr[1]);
		});
		
		clientsData.set(ws,inputMessage.get('gamername'));
		
		if (inputMessage.get('section') == 'dices'){
			//бросок 
			/*например: 
				inputMessage:
					"section"="dices"
					"gamername"="Icy"
					"gamercolor"="red"
					"targetname"="d8"
					"dice"="8"
					"dicecount"="3"
					"dicebonus"="0"
					"special"="hp"
					"special2"=""
			*/
			
			//формирование ответа
			let answer;
			
			if (inputMessage.get('special2') == ''){
				if (inputMessage.get('special') == 'hp'){
					answer = message + polydice(Number(inputMessage.get('dice')),Number(inputMessage.get('dicecount'))*2);
				} else if (inputMessage.get('special') == 'stats'){
					answer = message + polydice(Number(inputMessage.get('dice')),Number(inputMessage.get('dicecount'))*4);
				} else {
					answer = message + polydice(Number(inputMessage.get('dice')),Number(inputMessage.get('dicecount')));
				}
			}
			
			
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

