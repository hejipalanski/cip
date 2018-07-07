const net = require("net");
const http = require('http');
const StaticServer =  require('node-static').Server;
const file = new StaticServer('./public');
let clients = [];
let webclients = [];
const handlers = {};

let getAllTCPUsername = ()=> {
	usernames = [];
	for(let client of clients) {
		usernames.push(client.username);
	}
	return(usernames);
}

let getAllWEBSOCKusername = ()=> {
	usernames = [];
	for(let client of webclients) {
		usernames.push(client.username);
	}
	return(usernames);
}

let sendPM = (sender, message) => {
	let d = message.toString().split(' ');
	let username = d[1];
	let m = '';
	m = message.toString().replace('\r\n', '');
	m = m.replace(d[0], '');
	m = m.replace(username, '');
	for(let c of clients) {
		console.log(c.username);
		if(c.username === username + '') {
			c.instance.write('PM:' + sender.username + ': ' + m + '\r\n');
		}
	}
}

let displayActive = (sender) => {
	for(let c of clients) {
		sender.intance.write('ONLINE' + c.username);
	}
}

var notifywebclients = (sender, message) => {
	for(let wc of webclients) {
		if(wc.username === sender.username) {
			wc.instance.sendUTF(':You: ' + message);
		}
		else {
			wc.instance.sendUTF(':' + sender.username + ': ' + message);
		}
	}
}

var notifyTcpClients = (sender, message) => {
	for(let c of clients) {
		if(c.instance.name === sender.instance.name) {
			continue;
		}
		c.instance.write(':' + sender.username + ': ' + message);
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

//NET SERVER
const netServer = net.createServer((client) => {
	client.write('WELCOME MGA KA XHAMSTER\n');
	client.name = client.remoteAddress + ':' + client.remotePort;
	client.write('ENTER USERNAME: ');
	let user = {};
	client.on('data', (d) => {
		dataFromSockets = d.toString().replace('\r\n', '');
		switch(!isOnlist(client.name)) {
			case true:
				user['username'] = dataFromSockets;
				user['instance'] = client;
				notifyTcpClients(user, ' joined the chat\n');
				notifywebclients(user,' joined the chat\n');
				console.log(user.username + ' joined the chat\n');
				clients.push(user);
				break;
			case false:
			let message = dataFromSockets.split(' ');
				if(message[0].includes('private')) {
					sendPM(user, dataFromSockets);
				}
				else if(message[0].startsWith('-ol')) {
					if(clients.length > 0) {
						for(let i = 0; i < clients.length; i++) {
							client.write(clients[i].username + '\n');
						}
						for(let i=0; i < webclients.length; i++) {
							client.write(webclients[i].username+'\n');
						}
					}
					else {
						client.write("no other users online");
					}
				}
				else {
					notifywebclients(user, d);
					notifyTcpClients(user, d);
				}
				break;
		}
	});
	client.on('end', () => {
		notifywebclients(user,' has left\n');
		notifyTcpClients(user, ' has left\n');
		clients.pop(user);
	});
});

netServer.on('error', (err) => {
	if(err) {
		console.log(err);
	}
});

netServer.listen(5555, () => {
	console.log('socket open on port 5555');
});

handlers['/'] = (req, res) => {
	file.serveFile('/index.html', 200, {"Content-Type" : "text/html"}, req, res);
}

handlers['/users'] = (req, res) => {
	let usernames = getAllTCPUsername().concat(getAllWEBSOCKusername());
	res.writeHead(200, { "Content-Type" : "application/json" });
	res.end(JSON.stringify(usernames));
}

//HTTP SERVER
const server = http.createServer((req, res) => {
	console.log(req.url);
	if(handlers[req.url]) {
		handlers[req.url](req, res);
	}
	else {
		file.serve(req, res, (err, result) => {
			if(err) {
				res.writeHead(404, { "Content-Type" : "text/plain" });
				res.end(req.url + " not found");
			}
		});
	}
});
server.listen(3434);
console.log('listening on port 3434');

//WEBSOCKET SERVER
const WebSocketServer = require('websocket').server;
let wss = new WebSocketServer({ httpServer: server });
wss.on('request', (request) => {
	var connection = request.accept();
	let user = {};
	user['instance'] = connection;
	user['socket'] = connection.socket;
	connection.on('message', (message) => {
		message = JSON.parse(message.utf8Data);
		switch(message.type) {
			case 'name':
				user['username'] = message.username;
				notifyTcpClients(user, ' joined the chat\n');
				notifywebclients(user, ' joined the chat\n');
				webclients.push(user);
				break;
			default: console.log('Received ' + message.message);
				notifywebclients(user, message.message);
				notifyTcpClients(user, message.message + '\r\n');
				break;
		}
	});

	connection.on('close', (reasonCode, description) => {
		notifywebclients(user,' has left\n');
		notifyTcpClients(user, ' has left\n');
	});
});
