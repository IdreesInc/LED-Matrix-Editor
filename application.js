const INITIAL_COLOR = [255, 64, 64];
const NUM_OF_COLORS = 8;
const OFF_COLOR = "rgb(155, 155, 155)";
const MATRIX_SIZE = 32; // If adjusted, stylesheet must also be adjusted to match
const CANVAS_SIZE = 256;

let matrix = document.getElementById("matrix");
let palette = document.getElementById("palette");
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let color = INITIAL_COLOR;
let previousColors = [
    [255, 146, 76],
    [255, 202, 58],
    [138, 201, 38],
    [25, 130, 196]

];
let colorWheel;
let eraser = false;

function init() {
    initMatrix();
    initPalette();
    window.onresize = resizePalette;
    if (inIframe()) {
        document.body.style.background = "none";
        document.getElementById("signature").style.display = "none";
        window.top.postMessage("frame-height: " + window.document.body.scrollHeight, "*");
        window.onmessage = (e) => {
            if (typeof e.data === "string" && e.data === "clear") {
                clear();
            }
        };
    }
}

function initMatrix() {
    for (let row = 0; row < MATRIX_SIZE; row++) {
        for (let column = 0; column < MATRIX_SIZE; column++) {
            createDot(row, column);
        }
    }
    
    ["mousedown", "mousemove"].forEach(eventName => matrix.addEventListener(eventName, e => {
        if (e.buttons > 0) {
            let rect = matrix.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            drawAtCoordinates(x, y)
        }
    }));
    
    ["touchstart", "touchmove"].forEach(eventName => matrix.addEventListener(eventName, e => {
        if (e.touches.length === 1) {
            let rect = matrix.getBoundingClientRect();
            let x = e.touches[0].clientX - rect.left;
            let y = e.touches[0].clientY - rect.top;
            drawAtCoordinates(x, y)
        }
    }));
}

function initPalette() {
    colorWheel = new ReinventedColorWheel({
        appendTo: document.getElementById("color-wheel"),
        rgb: INITIAL_COLOR,
        wheelDiameter: 200,
        wheelThickness: 20,
        handleDiameter: 20,
        wheelReflectsSaturation: false,
        onChange: function (newColor) {
            color = newColor.rgb;
            document.documentElement.style.setProperty("--color", getColor());
        },
    });

    resizePalette();

    document.documentElement.style.setProperty("--color", getColor());
    // Add transition duration after setting everything up
    palette.style.transitionDuration = "0.35s";
    updatePaletteColors();

    for (let i = 1; i <= NUM_OF_COLORS; i++) {
        document.getElementById("color-" + i).onclick = () => {
            if (i <= previousColors.length) {
                color = previousColors[i - 1];
                previousColors.splice(i - 1, 1);
                document.documentElement.style.setProperty("--color", getColor());
                eraser = false;
                document.getElementById("eraser").classList.remove("control-selected");
                updatePaletteColors();
                updateWheel();
            }
        }
    }

    document.getElementById("eraser").onclick = () => {
        eraser = true;
        document.documentElement.style.setProperty("--color", "rgba(255, 255, 255, 0.5)");
        document.getElementById("eraser").classList.add("control-selected");
    }

    document.getElementById("save").onclick = () => {
        // Snippet from https://github.com/gillyb/reimg
        let a = document.createElement('a');
        a.href = canvas.toDataURL();
        a.download = "graduation-cap-design";
        document.body.appendChild(a);
        a.click();
    }

    document.getElementById("clear").onclick = () => {
        if (inIframe()) {
            window.top.postMessage("clear", "*");
        } else if (confirm("Are you sure you want to clear away everything? There is no way to undo this!")) {
            clear();
        }
    }

    document.getElementById("import-input").addEventListener("change", () => {
        let file = document.getElementById("import-input").files[0];
        if (file) {
            let reader = new FileReader();
            reader.addEventListener("load", function () {
              drawImage(reader.result);
            }, false);
            reader.readAsDataURL(file);
        }
    });
}

function createDot(row, column) {
    let cell = document.createElement("div");
    cell.id = "cell-" + row + "-" + column;
    cell.className = "cell";
    let dot = document.createElement("div");
    dot.id = "dot-" + row + "-" + column;
    dot.className = "dot";
    dot.classList.add("dim");
    cell.appendChild(dot);
    matrix.appendChild(cell);
}

function resizePalette() {
    let width = Math.min(palette.offsetWidth / 4, 250);
    document.getElementById("color-wheel").style.width = width + "px";
    document.getElementById("color-wheel").style.height = width + "px";
    document.documentElement.style.setProperty("--circle-diameter", width * 0.40 + "px");
    colorWheel.wheelDiameter = width;
    colorWheel.redraw();
}

function drawAtCoordinates(x, y) {
    let rect = matrix.getBoundingClientRect();
    let column = Math.floor(x / (rect.width / MATRIX_SIZE));
    let row = Math.floor(y / (rect.height / MATRIX_SIZE));
    draw(row, column);
}

function draw(row, column) {
    let dot = document.getElementById("dot-" + row + "-" + column);
    let size = CANVAS_SIZE / MATRIX_SIZE;
    if (eraser) {
        dot.classList.add("dim");
        dot.classList.remove("glow");
        dot.style.boxShadow = null;
        dot.style.background = OFF_COLOR;
        ctx.clearRect(column * size, row * size, size, size);
    } else {
        dot.classList.remove("dim");
        dot.classList.add("glow");
        dot.style.boxShadow = "0 0px 12px " + getColor(0.6);
        dot.style.backgroundColor = getColor();
        updatePaletteColors();
        ctx.beginPath();
        ctx.fillStyle = getColor();
        ctx.rect(column * size, row * size, size, size);
        ctx.fill();
        ctx.closePath();
    }
}

function clear() {
    let previousEraser = eraser;
    eraser = true;
    for (let row = 0; row < MATRIX_SIZE; row++) {
        for (let column = 0; column < MATRIX_SIZE; column++) {
            draw(column, row);
        }
    }
    eraser = previousEraser;
}

function drawImage(url) {
    let previousEraser = eraser;
    eraser = false;
    let image = new Image();
    image.onload = () => {
        ctx.drawImage(image, 0, 0, MATRIX_SIZE, MATRIX_SIZE);
        let imageData = ctx.getImageData(0, 0, MATRIX_SIZE, MATRIX_SIZE).data;
        for (let j = 0; j < imageData.length; j += 4) {
            let red = imageData[j];
            let green = imageData[j + 1];
            let blue = imageData[j + 2];
            let alpha = imageData[j + 3];
            if (alpha > 0.1) {
                color = [red, green, blue];
                draw(Math.floor(Math.floor(j / 4) / MATRIX_SIZE), Math.floor(j / 4) % MATRIX_SIZE);
            }
        }
        eraser = previousEraser;
        updateWheel();
    };
    image.src = url;
    clear();
}

function updatePaletteColors() {
    if (JSON.stringify(previousColors[0]) === JSON.stringify(color)) {
        return;
    }
    previousColors.unshift(color);
    for (let i = 1; i <= Math.min(NUM_OF_COLORS, previousColors.length); i++) {
        document.getElementById("color-" + i).style.background = "rgb(" + previousColors[i-1][0] +"," + previousColors[i-1][1] + "," + previousColors[i-1][2] + ")";
    }
}

function updateWheel() {
    colorWheel.rgb = color;
    colorWheel.redraw();
}

function getColor(opacity = 1) {
    return "rgba(" + color[0] +"," + color[1] + "," + color[2] + "," + opacity + ")";
}

function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

init();