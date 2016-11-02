const content = document.getElementById("content")!;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const counter = document.getElementById("counter")!;

const enum Channel {
	Red,
	Green,
	Blue,
	Alpha
}

const payoffs = [100, 0, 185, 0]; // scaled [1, 0, 1.85, 0];

let simulation: {stop: () => void, resize: () => void} | undefined = undefined;

function run() {
	try {
		const width = Math.max(parseInt((document.getElementById("input-width") as HTMLInputElement).value), 1);
		const height = Math.max(parseInt((document.getElementById("input-height") as HTMLInputElement).value), 1);
		const fps = Math.max(parseInt((document.getElementById("input-fps") as HTMLInputElement).value), 1);
		if (simulation) simulation.stop();
		simulation = createSimulation(width, height, fps);
	} catch (e) {

	}
}

function fullscreen() {
	if (document.fullscreenEnabled || document.webkitIsFullScreen) {
		if (document.exitFullscreen) document.exitFullscreen();
		else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
	} else {
		const el = document.getElementById("root")!;
		if (el.requestFullscreen) el.requestFullscreen();
		else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
		else if (el.webkitRequestFullScreen) el.webkitRequestFullScreen();
	}
}

if (!document.exitFullscreen && !document.webkitExitFullscreen) {
	document.getElementById("fullscreen")!.style.display = "none";
}

window.addEventListener("resize", () => {
	if (simulation) {
		simulation.resize();
	}
});

function createSimulation(width: number, height: number, fps: number) {
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext("2d");
	if (context === null) {
		throw new Error("Browser not supported");
	}

	const image1 = context.createImageData(width, height);
	const image2 = context.createImageData(width, height);

	let oldBoard = image1.data;
	let board = image2.data;
	const payoff = new Uint16Array(width * height);
	const bestPayoff = new Uint16Array(width * height);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (x * 2 + 1 === width && y * 2 + 1 === height) {
				set(board, x, y, Channel.Red, 255); // D
			} else {
				set(board, x, y, Channel.Blue, 255); // C
			}
			set(board, x, y, Channel.Alpha, 255);
			set(oldBoard, x, y, Channel.Alpha, 255);
		}
	}

	const timeout = setInterval(step, 1000 / fps);
	let iteration = 0;
	resize();
	draw();

	return { resize, stop };

	function resize() {
		const { clientWidth, clientHeight } = content;
		const scale = Math.min(clientWidth / width, clientHeight / height);

		const scaledWidth = width * scale;
		const scaledHeight = height * scale;

		canvas.style.width = scaledWidth + "px";
		canvas.style.height = scaledHeight + "px";

		canvas.style.top = (clientHeight - scaledHeight) / 2 + "px";
		canvas.style.left = (clientWidth - scaledWidth) / 2 + "px";
	}
	function step() {
		counter.textContent = "Iteration " + iteration;
		iteration++;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const playsD = isD(x, y);
				payoff[y * width + x] = getPayoff(playsD, playsD);
			}
		}

		forEachNeighbour(play);

		[oldBoard, board] = [board, oldBoard];

		// Copy board
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				copy(x, y, x, y);
				bestPayoff[y * width + x] = payoff[y * width + x];
			}
		}

		forEachNeighbour(compare);

		draw();
	}
	function draw() {
		context!.clearRect(0, 0, width, height);
		context!.putImageData(new ImageData(board, width, height), 0, 0);
	}
	function stop() {
		clearTimeout(timeout);
	}

	function set(b: Uint8ClampedArray, x: number, y: number, channel: Channel, value: number) {
		b[y * width * 4 + x * 4 + channel] = value;
	}
	function get(b: Uint8ClampedArray, x: number, y: number, channel: Channel) {
		return b[y * width * 4 + x * 4 + channel];
	}
	function isD(x: number, y: number) {
		return get(board, x, y, Channel.Red) === 255;
	}
	function getPayoff(selfD: boolean, opponentD: boolean) {
		return payoffs[
			+selfD * 2 + +opponentD
		];
	}

	function forEachNeighbour(callback: (x: number, y: number, otherX: number, otherY: number) => void) {
		// Vertical neighbours
		for (let y = 0; y < height - 1; y++) {
			for (let x = 0; x < width; x++) {
				callback(x, y, x, y + 1);
				callback(x, y + 1, x, y);
			}
		}
		// Horizontal neighbours
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width - 1; x++) {
				callback(x, y, x + 1, y);
				callback(x + 1, y, x, y);
			}
		}
		// Diagonal neighbours
		for (let y = 0; y < height - 1; y++) {
			for (let x = 0; x < width - 1; x++) {
				callback(x, y, x + 1, y + 1);
				callback(x + 1, y + 1, x, y);
				callback(x + 1, y, x, y + 1);
				callback(x, y + 1, x + 1, y);
			}
		}
	}
	function play(x: number, y: number, otherX: number, otherY: number) {
		payoff[y * width + x] +=
			getPayoff(isD(x, y), isD(otherX, otherY));
	}
	function copy(toX: number, toY: number, fromX: number, fromY: number) {
		set(board, toX, toY, Channel.Red, get(oldBoard, fromX, fromY, Channel.Red));
		set(board, toX, toY, Channel.Blue, get(oldBoard, fromX, fromY, Channel.Blue));
	}
	function compare(x: number, y: number, otherX: number, otherY: number) {
		const current = bestPayoff[y * width + x];
		const other = payoff[otherY * width + otherX];

		if (x === 9 && y === 6 && otherX === 10 && otherY === 6) {
			console.log({
				p: payoff[y * width + x],
				best: current,
				other
			});
		}

		if (other > current) {
			copy(x, y, otherX, otherY);
			bestPayoff[y * width + x] = other;
		}
	}
}
