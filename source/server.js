const net = require("net");
const http = require('http');
const StaticServer =  require('node-static').Server;
var file = new StaticServer('./public');
let clients = [];
const handlers = {};

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

let displayActive = (sender) => {
	for(let c of clients) {
		sender.intance.write('ONLINE' + c.username);
	}
}

var notifywebclients = (sender, message) => {
	for(let wc of webclients) {
		if(wc.username === sender.username) {
			continue;
		}
		wc.instance.sendUTF(':' + sender.username + ': ' + message);
	}
}

var broadcast = (sender, message) => {
	console.log(message.toString());
	if(message.includes('PRIVATE')) {
		sendPM(sender, message);
	}
	else {
		for(let c of clients) {
			if(c.instance.name === sender.instance.name) {
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

//NET SERVER
const netServer = net.createServer((client) => {
	client.write('WELCOME MGA KA XHAMSTER\n');
	client.name = client.remoteAddress + ':' + client.remotePort;
	client.write('ENTER USERNAME: ');
	let user = {};
	client.on('data', (d) => {
		dataFromSockets = d;
		switch(!isOnlist(client.name)) {
			case true:
				user['username'] = d.toString().replace('\r\n', '');
				user['instance'] = client;
				broadcast(user, ' joined the chat\n');
				notifywebclients(user,' joined the chat\n');
				console.log('On net Server ' + user.username + ' joined the chat\n');
				clients.push(user);
				break;
			case false:
				notifywebclients(user, d);
				broadcast(user, d);
				break;
		}
	});
	client.on('end', () => {
		notifywebclients(user,' has left\n');
		broadcast(user, ' has left\n');
		console.log(client.name + ' has left\n');
		clients.pop(user);
	});
});

netServer.on('error', (err) => {
	if(err) {
		console.log('no users online');
	}
});

netServer.listen(5555, () => {
	console.log('socket open on port 5555');
});

handlers['/'] = (req, res) => {
	file.serveFile('/index.html', 200, {"Content-Type" : "text/html"}, req, res);
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
				res.writeHead(404, {"Content-Type" : "text/plain"});
				res.end(req.url + " not found");
			}
		});
	}
});

server.listen(3434);
console.log('listening on port 3434');

var webclients = [];
//WEBSOCKET SERVER
const WebSocketServer = require('websocket').server;
let wss = new WebSocketServer({ httpServer: server});
wss.on('request', (request) => {
	var connection = request.accept();
	console.log('Received a connection');
	let user = {};
	user['username'] = connection.socket._peername.address + ':' + connection.socket._peername.port;
	user['instance'] = connection;
	user['socket'] = connection.socket;
	broadcast(user, ' joined the chat\n');
	webclients.push(user);
	connection.on('message', (message) => {
		message = JSON.parse(message);
		if(message.type == 'name') {
			user.username = message.username;
		}
		console.log('Received ' + message.utf8Data);
			notifywebclients(user, message.utf8Data);
			broadcast(user, message.utf8Data + '\r\n');
	});

	connection.on('close', (reasonCode, description) => {
		console.log('Connection closed');
	});
});
