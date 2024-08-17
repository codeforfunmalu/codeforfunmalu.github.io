// 启动测量并添加事件监听器
calibrateButton.addEventListener('click', () => {
    if (!scaleCalibrated) {
        alert('Please capture the image and calibrate the scale first.');
        return;
    }
    alert('Draw the area to measure on the image.');
    measuring = true;
    points = [];
    lines = [];
    canvas.addEventListener('pointerdown', startDrawing);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', stopDrawing);

    // 防止页面滚动
    document.body.style.overflow = 'hidden';
    canvas.addEventListener('touchstart', preventScroll, { passive: false });
    canvas.addEventListener('touchmove', preventScroll, { passive: false });
});

// 停止测量时恢复页面滚动
finishButton.addEventListener('click', () => {
    if (points.length > 2) {
        const areaPixels = calculatePolygonArea(points);
        const areaCm2 = areaPixels / (pixelsPerCm * pixelsPerCm);
        output.innerHTML = `Area: ${areaCm2.toFixed(2)} cm²`;
        measuring = false;
        canvas.removeEventListener('pointerdown', startDrawing);
        canvas.removeEventListener('pointermove', draw);
        canvas.removeEventListener('pointerup', stopDrawing);

        // 恢复页面滚动
        document.body.style.overflow = '';
        canvas.removeEventListener('touchstart', preventScroll);
        canvas.removeEventListener('touchmove', preventScroll);
    } else {
        alert('You need at least 3 points to form an area.');
    }
});

// 阻止默认行为以防止滚动
function preventScroll(event) {
    event.preventDefault();
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

// 其他绘制和测量功能保持不变
