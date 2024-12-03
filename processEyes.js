function processEyes(landmarks) {
    const leftEyeLandmarks = [468, 469, 470, 471, 472];
    const rightEyeLandmarks = [473, 474, 475, 476, 477];

    drawIris(landmarks, leftEyeLandmarks, 'blue'); // Left iris in blue
    drawIris(landmarks, rightEyeLandmarks, 'green'); // Right iris in green
}

function drawIris(landmarks, indices, color) {
    ctx.fillStyle = color;

    indices.forEach((index) => {
        const x = landmarks[index].x * VIDEO_WIDTH;
        const y = landmarks[index].y * VIDEO_HEIGHT;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI); // Larger radius for visibility
        ctx.fill();
    });
}
