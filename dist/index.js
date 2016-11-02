var content = document.getElementById("content");
var canvas = document.getElementById("canvas");
var counter = document.getElementById("counter");
var payoffs = [100, 0, 185, 0]; // scaled [1, 0, 1.85, 0];
var simulation = undefined;
function run() {
    try {
        var width = Math.max(parseInt(document.getElementById("input-width").value), 1);
        var height = Math.max(parseInt(document.getElementById("input-height").value), 1);
        var fps = Math.max(parseInt(document.getElementById("input-fps").value), 1);
        if (simulation)
            simulation.stop();
        simulation = createSimulation(width, height, fps);
    }
    catch (e) {
    }
}
function fullscreen() {
    if (document.fullscreenEnabled || document.webkitIsFullScreen) {
        if (document.exitFullscreen)
            document.exitFullscreen();
        else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen();
    }
    else {
        var el = document.getElementById("root");
        if (el.requestFullscreen)
            el.requestFullscreen();
        else if (el.webkitRequestFullscreen)
            el.webkitRequestFullscreen();
        else if (el.webkitRequestFullScreen)
            el.webkitRequestFullScreen();
    }
}
if (!document.exitFullscreen && !document.webkitExitFullscreen) {
    document.getElementById("fullscreen").style.display = "none";
}
window.addEventListener("resize", function () {
    if (simulation) {
        simulation.resize();
    }
});
function createSimulation(width, height, fps) {
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext("2d");
    if (context === null) {
        throw new Error("Browser not supported");
    }
    var image1 = context.createImageData(width, height);
    var image2 = context.createImageData(width, height);
    var oldBoard = image1.data;
    var board = image2.data;
    var payoff = new Uint16Array(width * height);
    var bestPayoff = new Uint16Array(width * height);
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            if (x * 2 + 1 === width && y * 2 + 1 === height) {
                set(board, x, y, 0 /* Red */, 255); // D
            }
            else {
                set(board, x, y, 2 /* Blue */, 255); // C
            }
            set(board, x, y, 3 /* Alpha */, 255);
            set(oldBoard, x, y, 3 /* Alpha */, 255);
        }
    }
    var timeout = setInterval(step, 1000 / fps);
    var iteration = 0;
    resize();
    draw();
    return { resize: resize, stop: stop };
    function resize() {
        var clientWidth = content.clientWidth, clientHeight = content.clientHeight;
        var scale = Math.min(clientWidth / width, clientHeight / height);
        var scaledWidth = width * scale;
        var scaledHeight = height * scale;
        canvas.style.width = scaledWidth + "px";
        canvas.style.height = scaledHeight + "px";
        canvas.style.top = (clientHeight - scaledHeight) / 2 + "px";
        canvas.style.left = (clientWidth - scaledWidth) / 2 + "px";
    }
    function step() {
        counter.textContent = "Iteration " + iteration;
        iteration++;
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var playsD = isD(x, y);
                payoff[y * width + x] = getPayoff(playsD, playsD);
            }
        }
        forEachNeighbour(play);
        _a = [board, oldBoard], oldBoard = _a[0], board = _a[1];
        // Copy board
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                copy(x, y, x, y);
                bestPayoff[y * width + x] = payoff[y * width + x];
            }
        }
        forEachNeighbour(compare);
        draw();
        var _a;
    }
    function draw() {
        context.clearRect(0, 0, width, height);
        context.putImageData(new ImageData(board, width, height), 0, 0);
    }
    function stop() {
        clearTimeout(timeout);
    }
    function set(b, x, y, channel, value) {
        b[y * width * 4 + x * 4 + channel] = value;
    }
    function get(b, x, y, channel) {
        return b[y * width * 4 + x * 4 + channel];
    }
    function isD(x, y) {
        return get(board, x, y, 0 /* Red */) === 255;
    }
    function getPayoff(selfD, opponentD) {
        return payoffs[+selfD * 2 + +opponentD];
    }
    function forEachNeighbour(callback) {
        // Vertical neighbours
        for (var y = 0; y < height - 1; y++) {
            for (var x = 0; x < width; x++) {
                callback(x, y, x, y + 1);
                callback(x, y + 1, x, y);
            }
        }
        // Horizontal neighbours
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width - 1; x++) {
                callback(x, y, x + 1, y);
                callback(x + 1, y, x, y);
            }
        }
        // Diagonal neighbours
        for (var y = 0; y < height - 1; y++) {
            for (var x = 0; x < width - 1; x++) {
                callback(x, y, x + 1, y + 1);
                callback(x + 1, y + 1, x, y);
                callback(x + 1, y, x, y + 1);
                callback(x, y + 1, x + 1, y);
            }
        }
    }
    function play(x, y, otherX, otherY) {
        payoff[y * width + x] +=
            getPayoff(isD(x, y), isD(otherX, otherY));
    }
    function copy(toX, toY, fromX, fromY) {
        set(board, toX, toY, 0 /* Red */, get(oldBoard, fromX, fromY, 0 /* Red */));
        set(board, toX, toY, 2 /* Blue */, get(oldBoard, fromX, fromY, 2 /* Blue */));
    }
    function compare(x, y, otherX, otherY) {
        var current = bestPayoff[y * width + x];
        var other = payoff[otherY * width + otherX];
        if (x === 9 && y === 6 && otherX === 10 && otherY === 6) {
            console.log({
                p: payoff[y * width + x],
                best: current,
                other: other
            });
        }
        if (other > current) {
            copy(x, y, otherX, otherY);
            bestPayoff[y * width + x] = other;
        }
    }
}
