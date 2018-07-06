
var ws;
function init() {
	var url = document.URL.replace("http://", "ws://");
	ws = new WebSocket(url);
	ws.onopen = (evt) => {}
	ws.onclose = (evt) => {};
	ws.onmessage = (evt) => {
		var p = document.createElement("p");
		p.innerHTML = evt.data;
		document.getElementById("chatSession").appendChild(p);
	}
	ws.enerror = () => {
	}
}
function send() {
	ws.send(document.getElementById("input").value);
}

