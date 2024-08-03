const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const captureButton = document.getElementById('captureButton');
const measureButton = document.getElementById('measureButton');
const finishButton = document.getElementById('finishButton');
const undoButton = document.getElementById('undoButton');
const output = document.getElementById('output');

const calibrationFrame = document.createElement('div');
calibrationFrame.classList.add('calibration-frame');
document.body.appendChild(calibrationFrame);

let pixelsPerCm;
let measuring = false;
let points = [];
let lines = [];
let undoneLines = [];

// 获取相机视频流，指定使用后置摄像头
navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'environment' } } })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        video.style.display = 'block';
        calibrationFrame.style.display = 'block'; // 确保校准框显示
    })
    .catch(err => {
        console.error("Error accessing camera: ", err);
        alert("Could not access the camera. Please check permissions and try using a different browser if the problem persists.");
    });

// 捕获图片并校准比例尺
captureButton.addEventListener('click', () => {
    if (video.readyState === 4) { 
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        canvas.style.display = 'block';
        video.style.display = 'none';
        calibrationFrame.style.display = 'none';

        // 假设校准框的实际大小是8.8cm x 6.5cm
        const actualWidthCm = 8.8;
        const frameWidthPx = calibrationFrame.clientWidth;

        pixelsPerCm = frameWidthPx / actualWidthCm;
        alert('Scale calibrated. You can now measure areas.');
    } else {
        alert("Video not ready. Please ensure your camera is functioning correctly.");
    }
});

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
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
