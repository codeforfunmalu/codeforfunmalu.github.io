// 獲取 DOM 元素
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
let lines = [];
let isDrawing = false;

// 啟動攝像頭
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 } })
    .then(stream => {
        video.srcObject = stream;
        video.play();
    })
    .catch(err => {
        console.error("Error accessing camera: ", err);
        alert("無法存取攝像頭。請檢查權限並嘗試使用不同的瀏覽器。");
    });

// 捕捉圖像和校準
captureButton.addEventListener('click', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    video.style.display = 'none';
    canvas.style.display = 'block';
    calibrationFrame.style.display = 'none';

    // 根據校準框的尺寸和實際尺寸計算每厘米的像素數
    const frameWidthCm = 8.8; // 實際板子的寬度
    const frameHeightCm = 6.5; // 實際板子的高度
    const frameWidthPx = calibrationFrame.clientWidth;
    const frameHeightPx = calibrationFrame.clientHeight;
    const pixelsPerCmWidth = frameWidthPx / frameWidthCm;
    const pixelsPerCmHeight = frameHeightPx / frameHeightCm;

    // 選擇較精確的像素比率
    pixelsPerCm = (pixelsPerCmWidth + pixelsPerCmHeight) / 2;

    scaleCalibrated = true;
    alert('比例尺已校準。現在可以測量面積。');
});

// 開始測量
calibrateButton.addEventListener('click', () => {
    if (!scaleCalibrated) {
        alert('請先捕捉圖像並校準比例尺。');
        return;
    }
    alert('在圖像上繪製要測量的區域。');
    measuring = true;
    points = [];
    lines = [];
    canvas.style.touchAction = 'none'; // 禁止瀏覽器對觸控行為的預設處理
    canvas.addEventListener('pointerdown', startDrawing, { passive: false });
    canvas.addEventListener('pointermove', draw, { passive: false });
    canvas.addEventListener('pointerup', stopDrawing, { passive: false });
    document.body.style.overflow = 'hidden'; // 防止頁面滾動
});

// 撤銷上一步操作
undoButton.addEventListener('click', () => {
    if (points.length > 0) {
        points.pop(); // 刪除最後一個點
        lines.pop(); // 刪除最後一條線
        redrawCanvas(); // 重繪畫布
    }
});

// 完成測量
finishButton.addEventListener('click', () => {
    if (points.length > 2) {
        // 自動連接第一個點和最後一個點以形成封閉的多邊形
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        if (firstPoint.x !== lastPoint.x || firstPoint.y !== lastPoint.y) {
            points.push({ x: firstPoint.x, y: firstPoint.y });
            drawLine(lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y);
            lines.push({ start: lastPoint, end: { x: firstPoint.x, y: firstPoint.y } });
        }

        const areaPixels = calculatePolygonArea(points);
        const areaCm2 = areaPixels / (pixelsPerCm * pixelsPerCm);
        output.innerHTML = `面積: ${areaCm2.toFixed(2)} 平方厘米`;
        measuring = false;
        canvas.removeEventListener('pointerdown', startDrawing);
        canvas.removeEventListener('pointermove', draw);
        canvas.removeEventListener('pointerup', stopDrawing);
        document.body.style.overflow = ''; // 恢復頁面滾動
    } else {
        alert('至少需要三個點才能形成區域。');
    }
});

// 開始繪製
function startDrawing(event) {
    event.preventDefault(); // 防止預設的滾動行為
    if (!measuring) return;
    const { offsetX, offsetY } = getEventPosition(event);
    points.push({ x: offsetX, y: offsetY });
    drawPoint(offsetX, offsetY);
    isDrawing = true;
}

// 繪製線條
function draw(event) {
    event.preventDefault(); // 防止預設的滾動行為
    if (!measuring || !isDrawing || points.length === 0) return;
    const { offsetX, offsetY } = getEventPosition(event);
    const lastPoint = points[points.length - 1];
    drawLine(lastPoint.x, lastPoint.y, offsetX, offsetY);
    points.push({ x: offsetX, y: offsetY });
    lines.push({ start: lastPoint, end: { x: offsetX, y: offsetY } });
}

// 停止繪製
function stopDrawing(event) {
    event.preventDefault(); // 防止預設的滾動行為
    isDrawing = false;
}

// 獲取觸控或鼠標位置
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

// 繪製點
function drawPoint(x, y) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
}

// 繪製線條
function drawLine(x1, y1, x2, y2) {
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

// 重新繪製畫布內容
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    lines.forEach(line => drawLine(line.start.x, line.start.y, line.end.x, line.end.y));
    points.forEach(point => drawPoint(point.x, point.y));
}

// 計算多邊形面積
function calculatePolygonArea(points) {
    let area = 0;
    const n = points.length;
    if (n < 3) return 0; // 需要至少3個點才能形成多邊形

    for (let i = 0; i < n; i++) {
        const { x: x1, y: y1 } = points[i];
        const { x: x2, y: y2 } = points[(i + 1) % n];
        area += x1 * y2 - y1 * x2;
    }
    return Math.abs(area) / 2;
}
