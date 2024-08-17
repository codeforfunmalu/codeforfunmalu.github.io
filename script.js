// 获取 DOM 元素
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const captureButton = document.getElementById('captureButton');
const calibrateButton = document.getElementById('calibrateButton');
const finishButton = document.getElementById('finishButton');
const undoButton = document.getElementById('undoButton');

let scaleCalibrated = false;
let measuring = false;
let pixelsPerCm = 1;
let points = [];
let lines = [];

// 启动摄像头
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
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

    const frameWidthCm = 8.8; // Actual width of the calibration frame in cm
    const frameWidthPx = document.querySelector('.calibration-frame').offsetWidth;
    pixelsPerCm = frameWidthPx / frameWidthCm;
    scaleCalibrated = true;
    alert('Scale calibrated. You can now measure areas.');
});

calibrateButton.addEventListener('click', () => {
    if (!scaleCalibrated) {
        alert('Please capture the image and calibrate the scale first.');
        return;
    }
    alert('Draw the area to measure on the image.');
    measuring = true;
    points = [];
    canvas.addEventListener('pointerdown', startDrawing);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', stopDrawing);

    document.body.style.overflow = 'hidden'; // Prevents page scrolling
});

finishButton.addEventListener('click', () => {
    if (points.length > 2) {
        const areaPixels = calculatePolygonArea(points);
        const areaCm2 = areaPixels / (pixelsPerCm * pixelsPerCm);
        output.innerHTML = `Area: ${areaCm2.toFixed(2)} cm²`;
        measuring = false;
        canvas.removeEventListener('pointerdown', startDrawing);
        canvas.removeEventListener('pointermove', draw);
        canvas.removeEventListener('pointerup', stopDrawing);

        document.body.style.overflow = ''; // Allows page scrolling
    } else {
        alert('You need at least 3 points to form an area.');
    }
});

undoButton.addEventListener('click', () => {
    if (points.length > 0) {
        points.pop();
        redrawCanvas();
    }
});

function startDrawing(event) {
    const pos = getEventPosition(event);
    points.push(pos);
    drawPoint(pos);
}

function draw(event) {
    if (!measuring) return;
    const pos = getEventPosition(event);
    if (points.length > 0) {
        const lastPoint = points[points.length - 1];
        drawLine(lastPoint, pos);
    }
    points.push(pos);
}

function stopDrawing() {
    canvas.removeEventListener('pointermove', draw);
    canvas.removeEventListener('pointerup', stopDrawing);
}

function getEventPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function drawPoint(point) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawLine(start, end) {
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    points.forEach(drawPoint);
    for (let i = 0; i < points.length - 1; i++) {
        drawLine(points[i], points[i + 1]);
    }
}

function calculatePolygonArea(points) {
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
        area += points[i].x * points[(i + 1) % n].y - points[(i + 1) % n].x * points[i].y;
    }
    return Math.abs(area / 2);
}
