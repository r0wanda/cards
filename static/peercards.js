var notifs;
window.addEventListener('load', () => { notifs = new Notifs(); });

class Cards {
	black;
	hand;
	conn;
	peer;
	uuid;
	name;
	czar;
	constructor(peer, conn, uuid) {
		this.hand = [];
		this.conn = conn;
		this.uuid = uuid;
		this.name = null;
		this.peer = peer;
		this.czar = false;
	}
	deal(hand) {
		this.hand = hand;
		const handEl = document.querySelector('div#hand');
		for (var card of this.hand) {
			var el = document.createElement('div');
			var txt = document.createElement('p');
			el.className = 'card white';
			txt.innerText = card
			el.appendChild(txt);
			handEl.appendChild(el);
		}
		
		this.fanCards();
	}
	setName(name) {
		this.name = name;
		this.conn.send({
			type: 'name',
			name
		});
	}
	fanCards() {
		const handEl = document.querySelector('div#hand');
		var i = 1;
		const angle = 80;
		for (var ch of handEl.children) {
			ch.style.transform += `rotate(${-angle / 2 + angle / 11 * i}deg)`;
			ch.style.zIndex = i.toString();
			ch.addEventListener('click', function() {
				for (var c of handEl.children) {
					console.log(c,this);
					if (c === this) continue;
					this.style.animation = 'lowercard .2s ease-out forwards';
				}
				this.style.animation = 'raisecard .2s ease-out forwards';
			});
			ch.addEventListener('mouseover', function() {
				var chs = [...handEl.children];
				var fcd = chs.indexOf(this) + 1;
				var idx = 1;
				var zid = 1;
				for (var c of chs) {
					console.log(fcd, idx, zid);
					if (idx === fcd) {
						c.style.zIndex = "10";
						zid = 10;
						idx++;
						continue;
					} else if (idx < fcd) zid++;
					else zid--;
					var cd = chs.indexOf(c) + 1;
					c.style.zIndex = zid;
					idx++;
				}
			});
			i++;
		}
		setTimeout(() => {
			for (var ch of document.querySelectorAll('div.card'))
				ch.style.transitionDuration = '0.0s';;
		}, 300);
	}
	redirJoin(conn) {
		notifs.info('Redirecting to the join page in 5 seconds');
		setTimeout(() => {
			var joinUrl = new URL(window.location.href);
			joinUrl.pathname = '/join';
			joinUrl.search = `?id=${conn.peer}`;
			window.location.href = joinUrl.href;
		}, 5000);
	}
	getUsername(name) {
		return new Promise(r => {
			const cont = document.querySelector('div#pcont');
			const prompt = document.querySelector('div#prompt');
			const head = document.querySelector('h1#phead');
			const input = document.querySelector('input#pinput');
			const submit = document.querySelector('button#submit');
			input.value = name;
			input.addEventListener('keypress', ev => {
				if (ev.key.toLowerCase() == 'enter') {
					ev.preventDefault();
					submit.click();
				}
			});
			submit.onclick = () => {
				if (input.value.length < 1) {
					notifs.error('Username must be at least one character');
				} else if (input.value == name) {
					notifs.error('Choose a different name');
				} else {
					cont.style.animation = 'hide .3s linear forwards';
					setTimeout(() => { cont.style.display = 'none'; }, 300);
					r(input.value);
				}
			}
			cont.style.display = 'flex';
			if (cont.style.opacity != 1) cont.style.animation = 'show .3s linear forwards';
			input.focus();
		});
	}
	showBlack(card) {
		
	}
	async handle(d, conn) {
		console.log(d);
		if (this.conn === null) this.conn = conn;
		switch (d.type) {
			case 'sys_kick':
				console.error('sys kicked');
				notifs.error(`Kicked: ${d.reason}`);
				conn.close();
				this.redirJoin(conn);
				break;
			case 'kick':
				console.error('kicked');
				notifs.error(`Kicked: ${d.reason}`);
				conn.close();
				this.redirJoin(conn);
				break;
			case 'name_conflict':
				notifs.warn('Name is taken');
				conn.send({
					type: 'name',
					name: await this.getUsername(this.name)
				});
				break;
			case 'info':
				console.log(d.info);
				notifs.info(d.info);
				break;
			case 'deal':
				this.peer.disconnect();
				notifs.info('Peer is disconnecting from main server, game connection is intact');
				this.deal(d.hand);
				break;
			case 'refill':
				break;
			case 'czar':
				this.czar = true;
			case 'black':
				if (this.czar == true) this.showBlack(d.card);
				break;
		}
	}
}
