const INITIAL_COLOR = [255, 64, 64];
const NUM_OF_COLORS = 8;

let matrix = document.getElementById("matrix");
let palette = document.getElementById("palette");

let color = INITIAL_COLOR;
let previousColors = [];

function init() {
    initMatrix();
    initColorWheel();
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
            draw(x, y)
        }
    }));
    
    ["touchstart", "touchmove"].forEach(eventName => matrix.addEventListener(eventName, e => {
        if (e.touches.length === 1) {
            let rect = matrix.getBoundingClientRect();
            let x = e.touches[0].clientX - rect.left;
            let y = e.touches[0].clientY - rect.top;
            draw(x, y)
        }
    }));
}

function initColorWheel() {
    let width = Math.min(palette.offsetWidth / 3, 250);
    let colorWheel = new ReinventedColorWheel({
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
    document.documentElement.style.setProperty("--circle-diameter", width * 0.35 + "px");
    
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
                updatePaletteColors();
            }
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
    cell.appendChild(dot);
    matrix.appendChild(cell);
}

function draw(x, y) {
    let rect = matrix.getBoundingClientRect();
    let column = Math.floor(x / (rect.width / 32));
    let row = Math.floor(y / (rect.height / 32));
    let dot = document.getElementById("dot-" + row + "-" + column);
    dot.classList.add("glow");
    dot.style.background = getColor();
    dot.style.boxShadow = "0 0px 12px " + getColor(0.6);
    updatePaletteColors();
}

function updatePaletteColors() {
    if (previousColors[0] === color) {
        return;
    }
    previousColors.unshift(color);
    for (let i = 1; i <= Math.min(NUM_OF_COLORS, previousColors.length); i++) {
        document.getElementById("color-" + i).style.background = "rgb(" + previousColors[i-1][0] +"," + previousColors[i-1][1] + "," + previousColors[i-1][2] + ")";
    }
}

function getColor(opacity = 1) {
    return "rgba(" + color[0] +"," + color[1] + "," + color[2] + "," + opacity + ")";
}

init();