const net = require("net");
let clients = [];

let sendPM = (sender, message) => {
	let d = message.toString().split(' ');
	let username = d[1];
	let count = 2;
	let m = '';
	m = message.toString().replace('\r\n', '');
	m = m.replace('PRIVATE', '');
	m = m.replace(username, '');
	for(let c of clients) {
		count++;
		if(count != d.length-1) {}
		if(c.username === username + '') {
			c.instance.write('PM:' + sender.username + ': ' + m + '\r\n');
		}
	}
}

var broadcast = (sender, message) => {
	if(message.includes('PRIVATE')) {
		sendPM(sender, message);
	}
	else {
		for(let c of clients) {
			// console.log('client: ' + c);
			// console.log('sender : ' + sender);
			if(c.instance.name === sender.instance.name + '') {
				continue;
			}
			c.instance.write(':' + sender.username + ': ' + message);
		}
	}
}

var isOnlist = (c) => {
	let res = false;
	for(let client of clients) {
		if(client.instance.name == c) {
			res = true;
		}
	}
	return(res);
}

const server = net.createServer((client) => {
	client.write('WELCOME MGA KA XHAMSTER\n');
	client.name = client.remoteAddress + ':' + client.remotePort;
	client.write('ENTER USERNAME: ');
	let d = '';
	let user = {};
	client.on('data', (d) => {
		switch(!isOnlist(client.name)) {
			case true:
				// console.log('in not on list ' + !isOnlist(client.name));
				user['username'] = d.toString().replace('\r\n', '');
				user['instance'] = client;
				broadcast(user, ' joined the chat\n');
				console.log(user.username + ' joined the chat\n');
				clients.push(user);
				break;
			case false:
				broadcast(user, d);
				break;
		}
	});
	client.on('end', () => {
		broadcast(user, ' has left\n');
		console.log(client.name + ' has left\n');
		clients.pop(user);
	});
});

server.on('error', (err) => {
	// throw err;
	if(err) {
		console.log('no users online');
	}
});

server.listen(5555, () => {
	console.log('socket open on port 5555');
});

const WebSocketServer = require('websocket').server;
let wss = new WebSocketServer({ httpServer: server});
wss.on('request', (request) => {
	var connection = request.accept();
	console.log('Received a connection');
	connection.log('Connection' + connection);

	connection.on('message', (message) => {
		console.log('Received ' + message.utf8Data);
		connection.sendUTF(message.utf8Data);
	});

	connection.on('close', (reasonCode, description) => {
		console.log('Connection closed');
	});
});
