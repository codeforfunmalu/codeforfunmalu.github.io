const video = document.getElementById('video');
const canvas = document.getElementById('snapshot');
const captureButton = document.getElementById('capture');
const frame = document.getElementById('frame');
const photo = document.getElementById('photo');

// Create buttons for camera switching
const frontCameraButton = document.createElement('button');
frontCameraButton.textContent = 'Use Front Camera';
document.body.appendChild(frontCameraButton);

const backCameraButton = document.createElement('button');
backCameraButton.textContent = 'Use Back Camera';
document.body.appendChild(backCameraButton');

// Set canvas size to default (you can adjust as needed)
canvas.width = 640;
canvas.height = 480;

function startCamera(facingMode) {
    navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
    })
    .then(stream => {
        video.srcObject = stream;
        video.play(); // Explicitly start playback for iOS compatibility
    })
    .catch(error => {
        console.error('Error accessing the camera', error);
        alert('Error accessing the camera: ' + error.message);
    });
}

// Switch to the front camera
frontCameraButton.addEventListener('click', () => {
    startCamera('user');
});

// Switch to the back camera
backCameraButton.addEventListener('click', () => {
    startCamera('environment');
});

// Start with the back camera by default
startCamera('environment');

// Capture photo on button click
captureButton.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);  // Draw the video frame to canvas
    const imageData = canvas.toDataURL('image/png');  // Convert canvas to image data URL

    // Show the captured photo
    photo.src = imageData;

    // Create a link to download the photo
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'photo.png';  // Set the download file name
    link.click();  // Trigger the download
});

