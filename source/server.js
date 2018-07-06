const net = require("net");
let clients = {};

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
		clients['name'] = sender;
		clients['message'] = message;
	}
}

var isUserExists = (c) => {
	for(client in clients) {
		if (clients.has(client)) {
			console.log("That username already exists. Please choose something else.");
			res = true;
			console.log(clients);
		}
	}
} 

var isOnlist = (c) => {
	let res = false;
	if(clients['name'] == c) {
		res = true;
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
				console.log('in not on list ' + !isOnlist(client.name));
				user['username'] = d.toString().replace('\r\n', '');
				user['instance'] = client;
				if(!isUserExists(client.name)) {
					broadcast(user, ' joined the chat\n');
					console.log(user.username + ' joined the chat\n');
					clients[user.username] = user;
					for (var x in clients) {
						console.log("Key: " + x + '\n');
						console.log(`Values: `);
						var value = clients[x];
					}
				}
				break;
			case false:
				broadcast(user, d);
				break;
		}
	});
	client.on('end', () => {
		broadcast(user, ' has left\n');
		console.log(client.name + ' has left\n');
		if (user in clients) {
			    delete(clients[user]);
			}
	});
});

server.on('error', (err) => {
	if(err) {
		console.log('no users online');
	}
});

server.listen(5555, () => {
	console.log('socket open on port 5555');
});
