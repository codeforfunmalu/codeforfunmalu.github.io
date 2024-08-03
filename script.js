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

// 启动摄像头
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        video.onloadeddata = () => {
            calibrationFrame.style.display = 'block'; // 显示校准框
        };
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

    if (calibrationFrame.style.display === 'block') {
        // 根据校准框的尺寸和实际尺寸计算每厘米的像素数
        const frameWidthCm = 8.8; // 实际板子的宽度
        const frameWidthPx = calibrationFrame.clientWidth;
        pixelsPerCm = frameWidthPx / frameWidthCm;
        calibrationFrame.style.display = 'none';
        scaleCalibrated = true;
        alert('Scale calibrated. You can now measure areas.');
    }
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
    canvas.addEventListener('pointerdown', startDrawing);
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
    } else {
        alert('You need at least 3 points to form an area.');
    }
});

// 开始绘制区域
function startDrawing(event) {
    if (!measuring) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    points.push({ x, y });
    drawPoint(x, y);
    if (points.length > 1) {
        const prevPoint = points[points.length - 2];
        drawLine(prevPoint.x, prevPoint.y, x, y);
    }
}

// 绘制标记点
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
