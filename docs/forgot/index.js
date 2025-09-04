const messages = document.getElementById("messages");
const input = document.getElementById("input");
const counterText = document.getElementById('info-text');
const loadingText = document.getElementById('loading');

const ws = new WebSocket('wss://tracker.openwebtorrent.com');

const infoHash = String.fromCharCode(171, 160, 171, 109, 92, 85, 83, 92, 142, 41, 31, 171, 217, 38, 70, 21, 190, 22, 249, 55);

const randomId = () => {
	const id = [];
	for (let i = 0; i < 6; i += 1) id.push(Math.floor(26 * Math.random()) + 65);
	return String.fromCharCode(...id);
}; // this or first message as id?

const peerId = randomId();
// console.log('id: ', peerId);

let peerConnected = false;
const offeredConns = {};
const activeConns = {};
const channels = {};
let messageHist = [];
let requestedHistory = false;
let sessionStartTime = null;

// function formatElapsed(ms) {
// 	const totalSeconds = Math.floor(ms / 1000);
// 	const hours = Math.floor(totalSeconds / 3600);
// 	const minutes = Math.floor((totalSeconds % 3600) / 60);
// 	const seconds = totalSeconds % 60;

// 	if (hours > 0) return `${hours}ч ${minutes}м ${seconds}с`;
// 	if (minutes > 0) return `${minutes}м ${seconds}с`;
// 	return `${seconds}с`;
// }

function formatElapsed(ms) {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const pad = (n) => String(n).padStart(2, '0');
	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function addMessage(sender, msg) {
	if (messageHist.length >= 100) messageHist.shift();
	messageHist.push([sender, msg]);

	const msgEl = document.createElement('p');
	msgEl.innerHTML = `<b>${sender}:</b> ${msg}`;
	messages.appendChild(msgEl);
	messages.scrollTop = messages.scrollHeight;
}

function updateCounter() {
	const count = Object.keys(activeConns).length;

    if (!sessionStartTime) return;

	let msg = `В дискусията има <b>${count}</b> ${count === 1 ? 'друг' : 'други'}. Ти си <b>${peerId}</b>`;

    if (sessionStartTime) {
		const elapsed = formatElapsed(Date.now() - sessionStartTime);
		msg += `<br/>Плямпа се от <b>${elapsed}</b>.`;
        document.title = elapsed + ' - Забравиг'
	}

    counterText.innerHTML = msg
}

input.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') {
		const text = e.target.value.trim();
		if (!text) return;
		e.target.value = "";
		addMessage(peerId, text);

		Object.entries(channels).forEach(([id, channel]) => {
			try {
				channel.send(JSON.stringify({ type: 'msg', peerId, text }));
			} catch (err) {
				console.warn('Failed to send to', id);
			}
		});
	}
});

const createConnection = async (offer = null, remotePeerId = null) => {
	const conn = new RTCPeerConnection({
		iceServers: [
			// { urls: 'stun:stun.stunprotocol.org' },
			// { urls: 'stun:stun1.l.google.com:19302' },
			{
				urls: 'turn:relay1.expressturn.com:3480?transport=tcp',
				username: '000000002072346098',
				credential: 'xVN/Z6cI03wEB4tN7cOVMf7KVbw='
			}
		],
	});

	const channel = conn.createDataChannel('data', {
		ordered: true,
		negotiated: true,
		id: 0,
	});

	let remoteId = remotePeerId;

	const cleanup = () => {
		if (remoteId) {
			console.log(`Peer ${remoteId} disconnected.`);
			delete activeConns[remoteId];
			delete channels[remoteId];
			updateCounter();
		}
	};

	conn.oniceconnectionstatechange = () => {
		const state = conn.iceConnectionState;
		if (["disconnected", "failed", "closed"].includes(state)) {
			cleanup();
		}
	};

	channel.onopen = () => {
		channel.send(JSON.stringify({ type: 'intro', peerId }));

        if (sessionStartTime) {
            channel.send(JSON.stringify({ type: 'session_start_time', time: sessionStartTime }));
        }

		if (!requestedHistory) {
			channel.send(JSON.stringify({ type: 'req_hist' }));
			requestedHistory = true;
		}
	};

	channel.onmessage = (event) => {
		let data;
		try {
			data = JSON.parse(event.data);
		} catch {
			addMessage("unknown", event.data);
			return;
		}

		if (data.type === 'intro') {
			remoteId = data.peerId;
			if (!channels[remoteId]) {
				channels[remoteId] = channel;
				activeConns[remoteId] = conn;
				updateCounter();

                if (sessionStartTime === null && messageHist.length === 0) {
                    sessionStartTime = Date.now();
                    updateCounter();

                    setInterval(() => updateCounter(), 1000);
                }
			}

            if (!peerConnected) {
                peerConnected = true;
                loadingText.classList.add('hidden');
                counterText.classList.remove('hidden');
            }


			return;
		}

        if (data.type === 'session_start_time') {
            const incomingTime = data.time;
            if (!sessionStartTime || incomingTime < sessionStartTime) {
                sessionStartTime = incomingTime;
                updateCounter();
            }
            return;
        }

		if (data.type === 'msg') {
			addMessage(data.peerId || 'unknown', data.text);
		}

		if (data.type === 'req_hist') {
			channel.send(JSON.stringify({ type: 'hist', entries: messageHist }));
		}

		if (data.type === 'hist') {
			for (const [sender, text] of data.entries) {
				addMessage(sender, text);
			}
		}
	};

	if (offer) {
		await conn.setRemoteDescription(offer);
		const answer = await conn.createAnswer();
		await conn.setLocalDescription(answer);
	} else {
		const offerDesc = await conn.createOffer();
		await conn.setLocalDescription(offerDesc);
	}

	await new Promise((res) => setTimeout(res, 1));
	return { conn, channel };
};

async function sendMultipleOffers(n = 5) {
	const offers = [];

	for (let i = 0; i < n; i++) {
		const { conn } = await createConnection();
		const offerId = randomId();
		offers.push({ offer_id: offerId, offer: conn.localDescription });
		offeredConns[offerId] = conn;
	}

	ws.send(JSON.stringify({
		action: 'announce',
		info_hash: infoHash,
		peer_id: peerId,
		numwant: n,
		offers,
	}));
}

ws.onopen = async () => {
    loadingText.innerText = 'Чекаме люде...'
	await sendMultipleOffers(5);
};

ws.onmessage = async (msg) => {
	const data = JSON.parse(msg.data);
	if (data.info_hash !== infoHash || data.peer_id === peerId) return;

	if (data.action === 'announce') {
		if (data.offer && !activeConns[data.peer_id]) {
			const { conn } = await createConnection(data.offer, data.peer_id);

			ws.send(JSON.stringify({
				action: 'announce',
				info_hash: infoHash,
				peer_id: peerId,
				to_peer_id: data.peer_id,
				offer_id: data.offer_id,
				answer: conn.localDescription,
			}));

			activeConns[data.peer_id] = conn;
			updateCounter();
		}

		if (data.answer && offeredConns[data.offer_id]) {
			const conn = offeredConns[data.offer_id];
			await conn.setRemoteDescription(data.answer);
			delete offeredConns[data.offer_id];

			if (!activeConns[data.peer_id]) {
				activeConns[data.peer_id] = conn;
				updateCounter();

				// Optional: make a reverse offer just to ensure full mesh - mersi chat ji pi ti
				const { conn: reverseConn } = await createConnection(null, data.peer_id);
				const offerId = randomId();

				ws.send(JSON.stringify({
					action: 'announce',
					info_hash: infoHash,
					peer_id: peerId,
					numwant: 1,
					offers: [{ offer_id: offerId, offer: reverseConn.localDescription }],
				}));

				offeredConns[offerId] = reverseConn;
			}
		}
	}
};

setInterval(() => {
	sendMultipleOffers(3);
}, 5000);

ws.onclose = () => {
	console.log('WebSocket closed');
};
