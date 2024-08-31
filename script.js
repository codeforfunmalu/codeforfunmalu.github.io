// 获取DOM元素
const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const calibrateButton = document.getElementById('calibrateButton');
const measureButton = document.getElementById('measureButton');
const finishButton = document.getElementById('finishButton');
const undoButton = document.getElementById('undoButton');

let image, scale = null, measuring = false;
let points = [];
let pixelsPerCm;
let lines = [];
let undoneLines = [];

// 当用户选择图片时触发
imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    const reader = new FileReader();

    reader.onload = () => {
        image = new Image();
        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
        };
        image.src = reader.result;
    };
    reader.readAsDataURL(file);
});

// 当用户点击校准比例尺按钮时触发
calibrateButton.addEventListener('click', () => {
    alert('Please click on the start and end points of the scale (1 cm) on the image.');
    canvas.addEventListener('click', setScale);
});

// 设置比例尺
function setScale(event) {
    if (!scale) {
        startX = event.offsetX;
        startY = event.offsetY;
        scale = 'start';
        drawPoint(startX, startY);
    } else if (scale === 'start') {
        endX = event.offsetX;
        endY = event.offsetY;
        drawPoint(endX, endY);
        drawLine(startX, startY, endX, endY);
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        pixelsPerCm = distance; // 1 cm = distance in pixels
        scale = null;
        canvas.removeEventListener('click', setScale);
        alert('Scale calibrated.');
    }
}

// 当用户点击测量区域按钮时触发
measureButton.addEventListener('click', () => {
    alert('Please draw the area by dragging your finger or mouse. Click "Finish Measurement" when done.');
    measuring = true;
    points = [];
    lines = [];
    undoneLines = [];
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    // 禁用触控事件的默认行为
    canvas.addEventListener('touchstart', disableTouchScroll, { passive: false });
    canvas.addEventListener('touchmove', disableTouchScroll, { passive: false });
});

// 禁用触控事件的默认行为
function disableTouchScroll(event) {
    event.preventDefault();
}

// 当用户点击完成测量按钮时触发
finishButton.addEventListener('click', () => {
    if (points.length > 2) {
        const areaPixels = calculatePolygonArea(points);
        const areaCm2 = areaPixels / Math.pow(pixelsPerCm, 2);
        output.innerHTML = `Area: ${areaCm2.toFixed(2)} cm²`;
        measuring = false;
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);

        // 重新允许页面滚动
        canvas.removeEventListener('touchstart', disableTouchScroll);
        canvas.removeEventListener('touchmove', disableTouchScroll);
    } else {
        alert('You need at least 3 points to form an area.');
    }
});

// 当用户点击撤回按钮时触发
undoButton.addEventListener('click', () => {
    if (lines.length > 0) {
        const lastLine = lines.pop();
        undoneLines.push(lastLine);
        redraw();
    }
});

// 开始绘制
function startDrawing(event) {
    if (!measuring) return;
    const { offsetX, offsetY } = getEventPosition(event);
    points.push({ x: offsetX, y: offsetY });
    drawPoint(offsetX, offsetY);
}

// 绘制线条
function draw(event) {
    if (!measuring || points.length === 0) return;
    const { offsetX, offsetY } = getEventPosition(event);
    const lastPoint = points[points.length - 1];
    drawLine(lastPoint.x, lastPoint.y, offsetX, offsetY);
    points.push({ x: offsetX, y: offsetY });
    lines.push({ start: lastPoint, end: { x: offsetX, y: offsetY } });
}

// 停止绘制
function stopDrawing(event) {
    if (!measuring) return;
    canvas.removeEventListener('mousemove', draw);
    canvas.removeEventListener('mouseup', stopDrawing);
    canvas.removeEventListener('touchmove', draw);
    canvas.removeEventListener('touchend', stopDrawing);
}

// 获取触控或鼠标位置
function getEventPosition(event) {
    if (event.touches) {
        return {
            offsetX: event.touches[0].clientX - canvas.getBoundingClientRect().left,
            offsetY: event.touches[0].clientY - canvas.getBoundingClientRect().top
        };
    }
    return {
        offsetX: event.offsetX,
        offsetY: event.offsetY
    };
}

// 绘制点
function drawPoint(x, y) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
}

// 绘制线
function drawLine(x1, y1, x2, y2) {
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

// 重新绘制画布
function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image) {
        ctx.drawImage(image, 0, 0);
    }
    lines.forEach(line => drawLine(line.start.x, line.start.y, line.end.x, line.end.y));
}

// 计算多边形面积
function calculatePolygonArea(points) {
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
        const { x: x1, y: y1 } = points[i];
        const { x: x2, y: y2 } = points[(i + 1) % n];
        area += x1 * y2 - y1 * x2;
    }
    return Math.abs(area) / 2;
}
