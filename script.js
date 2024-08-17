// 获取 DOM 元素
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const calibrateButton = document.getElementById('calibrateButton');
const captureButton = document.getElementById('captureButton');
const finishButton = document.getElementById('finishButton');
const undoButton = document.getElementById('undoButton');
const calibrationFrame = document.querySelector('.calibration-frame');

let scaleCalibrated = false;
let measuring = false;
let pixelsPerCm = 1;
let points = [];
let isDrawing = false;

// 启动摄像头
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 } })
    .then(stream => {
        video.srcObject = stream;
        video.play();
    })
    .catch(err => {
        console.error("Error accessing camera: ", err);
        alert("Could not access the camera. Please check permissions and try using a different browser if the problem persists.");
    });

// 捕获图像和校准
captureButton.addEventListener('click', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    video.style.display = 'none';
    canvas.style.display = 'block';
    calibrationFrame.style.display = 'none';

    // 根据校准框的尺寸和实际尺寸计算每厘米的像素数
    const frameWidthCm = 8.8; // 实际板子的宽度
    const frameWidthPx = calibrationFrame.clientWidth;
    pixelsPerCm = frameWidthPx / frameWidthCm;
    scaleCalibrated = true;
    alert('Scale calibrated. You can now measure areas.');
});

// 开始测量
calibrateButton.addEventListener('click', () => {
    if (!scaleCalibrated) {
        alert('Please capture the image and calibrate the scale first.');
        return;
    }
    alert('Draw the area to measure on the image.');
    measuring = true;
    points = [];
    canvas.style.touchAction = 'none'; // 禁止浏览器对触控行为的默认处理
    canvas.addEventListener('pointerdown', startDrawing, { passive: false });
    canvas.addEventListener('pointermove', draw, { passive: false });
    canvas.addEventListener('pointerup', stopDrawing, { passive: false });
    document.body.style.overflow = 'hidden'; // 防止页面滚动
});

// 撤销上一步操作
undoButton.addEventListener('click', () => {
    if (points.length > 0) {
        points.pop(); // 删除最后一个点
        redrawCanvas(); // 重绘画布
    }
});

// 完成测量
finishButton.addEventListener('click', () => {
    if (points.length > 2) {
        const areaPixels = calculatePolygonArea(points);
        const areaCm2 = areaPixels / (pixelsPerCm * pixelsPerCm);
        output.innerHTML = `Area: ${areaCm2.toFixed(2)} cm²`;
        measuring = false;
        canvas.removeEventListener('pointerdown', startDrawing);
        canvas.removeEventListener('pointermove', draw);
        canvas.removeEventListener('pointerup', stopDrawing);
        document.body.style.overflow = ''; // 恢复页面滚动
    } else {
        alert('You need at least 3 points to form an area.');
    }
});

// 获取触控或鼠标位置
function getEventPosition(event) {
    event.preventDefault(); // 禁止默认的滚动行为
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

// 开始绘制区域
function startDrawing(event) {
    event.preventDefault(); // 禁止默认的滚动行为
    if (!measuring) return;
    const { offsetX, offsetY } = getEventPosition(event);
    points.push({ x: offsetX, y: offsetY });
    drawPoint(offsetX, offsetY);
    isDrawing = true;
}

function draw(event) {
    event.preventDefault(); // 禁止默认的滚动行为
    if (!measuring || !isDrawing || points.length === 0) return;
    const { offsetX, offsetY } = getEventPosition(event);
    const lastPoint = points[points.length - 1];
    drawLine(lastPoint.x, lastPoint.y, offsetX, offsetY);
    points.push({ x: offsetX, y: offsetY });
}

function stopDrawing(event) {
    event.preventDefault(); // 禁止默认的滚动行为
    isDrawing = false;
}

// 绘制标记点
function drawPoint(x, y) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
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

// 重新绘制画布上的内容
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    for (let i = 0; i < points.length; i++) {
        drawPoint(points[i].x, points[i].y);
        if (i > 0) {
            drawLine(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
        }
    }
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
