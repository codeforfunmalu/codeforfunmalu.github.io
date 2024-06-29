const video = document.getElementById('video');
const canvas = document.getElementById('snapshot');
const captureButton = document.getElementById('capture');
const frame = document.getElementById('frame');
const photo = document.getElementById('photo');
const frontCameraButton = document.createElement('button');
frontCameraButton.textContent = 'Use Front Camera';
document.body.appendChild(frontCameraButton);
const backCameraButton = document.createElement('button');
backCameraButton.textContent = 'Use Back Camera';
document.body.appendChild(backCameraButton);

function startCamera(facingMode) {
    navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: facingMode } }
    })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => {
        console.error('Error accessing the camera', error);
        alert('Error accessing the camera: ' + error.message);
    });
}

frontCameraButton.addEventListener('click', () => {
    startCamera('user');
});

backCameraButton.addEventListener('click', () => {
    startCamera('environment');
});

// 默認使用後鏡頭
startCamera('environment');

captureButton.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');

    // 顯示拍照結果
    photo.src = imageData;

    // 創建一個連結元素並觸發下載
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'photo.png';
    link.click();
});
