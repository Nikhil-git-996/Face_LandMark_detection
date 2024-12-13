const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

let video, canvas, ctx, faceMesh;
let leftEyeClosedTime = null;
let rightEyeClosedTime = null;
let totalEyeClosureTime = 0;  // Total time both eyes are closed
let alertShown = false;

// Initialize the camera feed
async function setupCamera() {
    video = document.getElementById('video');

    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT }
    });

    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            video.play();
            resolve(video);
        };
    });
}

// Initialize MediaPipe FaceMesh
function initializeFaceMesh() {
    faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
        maxNumFaces: 2, // Allow up to 2 faces for detection
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onResults);
}

// Process results and analyze
function onResults(results) {
    ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    const faces = results.multiFaceLandmarks;

    // Alert for multiple faces
    if (faces && faces.length > 1) {
        alert("Suspicious activity detected, No third person should be caught in front of the screen");
        return;
    }

    if (faces) {
        for (const landmarks of faces) {
            drawLandmarks(landmarks, 'red');
            monitorFaceDirection(landmarks);
            monitorEyeClosure(landmarks);
        }
    }

    // Display the eye closure time
    displayEyeClosureTime();
}

// Draw landmarks on the canvas
function drawLandmarks(landmarks, color) {
    ctx.fillStyle = color;

    landmarks.forEach((landmark) => {
        const x = landmark.x * VIDEO_WIDTH; // Scale x-coordinate
        const y = landmark.y * VIDEO_HEIGHT; // Scale y-coordinate

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// Monitor face direction
function monitorFaceDirection(landmarks) {
    const noseTip = landmarks[1]; // Nose tip landmark
    const noseBase = landmarks[168]; // Nose base landmark

    const faceCenterX = noseBase.x * VIDEO_WIDTH;

    if (faceCenterX < VIDEO_WIDTH * 0.3) {
        alert("Suspicious activity detected from face movement, please look at the screen");
    } else if (faceCenterX > VIDEO_WIDTH * 0.7) {
        alert("Suspicious activity detected from face movement, please look at the screen");
    }
}

// Monitor eye closure
function monitorEyeClosure(landmarks) {
    const leftEyeLandmarks = [159, 145]; // Top and bottom of left eye
    const rightEyeLandmarks = [386, 374]; // Top and bottom of right eye

    const leftEyeOpen = Math.abs(landmarks[leftEyeLandmarks[0]].y - landmarks[leftEyeLandmarks[1]].y) > 0.01;
    const rightEyeOpen = Math.abs(landmarks[rightEyeLandmarks[0]].y - landmarks[rightEyeLandmarks[1]].y) > 0.01;

    const currentTime = performance.now();

    // If both eyes are closed
    if (!leftEyeOpen && !rightEyeOpen) {
        if (leftEyeClosedTime === null && rightEyeClosedTime === null) {
            leftEyeClosedTime = currentTime;
            rightEyeClosedTime = currentTime;
        }
        // Accumulate time if both eyes are closed
        totalEyeClosureTime += (currentTime - leftEyeClosedTime) / 1000; // Convert to seconds
    } else {
        // Reset if either eye is open
        leftEyeClosedTime = null;
        rightEyeClosedTime = null;
        totalEyeClosureTime = 0;  // Reset total closure time when both eyes are open
    }

    // If both eyes have been closed for more than 3 seconds, trigger the alert
    if (totalEyeClosureTime > 3 && !alertShown) {
        alert("Suspicious activity detected from eye movement, please open your eyes");
        alertShown = true; // Show the alert only once
    } else {
        alertShown = false; // Reset if both eyes are open
    }
}

// Display the eye closure time on the canvas
function displayEyeClosureTime() {
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Total Eye Closure Time: ${totalEyeClosureTime.toFixed(2)}s`, 10, 30);
}

// Continuously process video frames
async function detectFaces() {
    await faceMesh.send({ image: video });
    requestAnimationFrame(detectFaces);
}

// Main function
async function main() {
    await setupCamera();

    canvas = document.getElementById('output');
    ctx = canvas.getContext('2d');

    canvas.width = VIDEO_WIDTH;
    canvas.height = VIDEO_HEIGHT;

    initializeFaceMesh();
    detectFaces();
}

main();
