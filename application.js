const INITIAL_COLOR = [255, 202, 58];
const NUM_OF_COLORS = 9;
const OFF_COLOR = "rgb(155, 155, 155)";

let matrix = document.getElementById("matrix");
let palette = document.getElementById("palette");
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let color = INITIAL_COLOR;
let previousColors = [
    [255, 146, 76],
    [255, 64, 64],
    [138, 201, 38],
    [25, 130, 196]

];
let colorWheel;
let eraser = false;

function init() {
    initMatrix();
    initColorUI();
    if (inIframe()) {
        document.body.style.background = "none";
    }
}

function initMatrix() {
    for (let row = 0; row < 32; row++) {
        for (let column = 0; column < 32; column++) {
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

function initColorUI() {
    let width = Math.min(palette.offsetWidth / 4, 250);
    colorWheel = new ReinventedColorWheel({
        appendTo: document.getElementById("color-wheel"),
        rgb: INITIAL_COLOR,
        wheelDiameter: width,
        wheelThickness: 20,
        handleDiameter: 20,
        wheelReflectsSaturation: false,
        onChange: function (newColor) {
            color = newColor.rgb;
            palette.style.background = getColor();
        },
    });

    document.getElementById("color-wheel").style.width = width + "px";
    document.getElementById("color-wheel").style.height = width + "px";
    document.documentElement.style.setProperty("--circle-diameter", width * 0.40 + "px");
    
    colorWheel.redraw();

    palette.style.background = getColor();
    // Add transition duration after setting everything up
    palette.style.transitionDuration = "0.35s";
    updatePaletteColors();

    for (let i = 1; i <= NUM_OF_COLORS; i++) {
        document.getElementById("color-" + i).onclick = () => {
            if (i <= previousColors.length) {
                color = previousColors[i - 1];
                previousColors.splice(i - 1, 1);
                palette.style.background = getColor();
                eraser = false;
                document.getElementById("eraser").classList.remove("control-selected");
                updatePaletteColors();
                updateWheel();
            }
        }
    }

    document.getElementById("eraser").onclick = () => {
        eraser = true;
        palette.style.background = "rgba(255, 255, 255, 0.5)";
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
        if (confirm("Are you sure you want to clear away everything? There is no way to undo this!")) {
            let previousEraser = eraser;
            eraser = true;
            for (let row = 0; row < 32; row++) {
                for (let column = 0; column < 32; column++) {
                    draw(column, row);
                }
            }
            eraser = previousEraser;
        }
    }
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

function drawAtCoordinates(x, y) {
    let rect = matrix.getBoundingClientRect();
    let column = Math.floor(x / (rect.width / 32));
    let row = Math.floor(y / (rect.height / 32));
    draw(row, column);
}

function draw(row, column) {
    let dot = document.getElementById("dot-" + row + "-" + column);
    if (eraser) {
        dot.classList.add("dim");
        dot.classList.remove("glow");
        dot.style.boxShadow = null;
        dot.style.background = OFF_COLOR;
        ctx.clearRect(column, row, 1, 1);
    } else {
        dot.classList.remove("dim");
        dot.classList.add("glow");
        dot.style.boxShadow = "0 0px 12px " + getColor(0.6);
        dot.style.backgroundColor = getColor();
        updatePaletteColors();
        ctx.beginPath();
        ctx.fillStyle = getColor();
        ctx.rect(column, row, 1, 1);
        ctx.fill();
        ctx.closePath();
    }
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