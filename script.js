// I... I am sorry for what you will see

document.addEventListener('DOMContentLoaded', () => {
    const textureCanvas = document.getElementById('textureCanvas');
    const textureCtx = textureCanvas.getContext('2d');

    const noiseCanvas = document.getElementById('noiseCanvas');
    const noiseCtx = noiseCanvas.getContext('2d');

    const topBarContainer = document.getElementById('top-bar-container');
    const emptyCircleDiv = document.createElement('div');
    emptyCircleDiv.classList.add(
        'w-8', 'h-8', 'border-2', 'border-gray-400', 'rounded-full', 'flex', 'items-center', 'justify-center'
    );
    if (topBarContainer) {
        topBarContainer.appendChild(emptyCircleDiv);
    } else {
        console.error('Top bar container not found!');
    }

    let time = 0;
    const scale = 0.01;
    const speed = 0.005;
    const sharpness = 1;
    const numNoiseScratches = 2;

    const outlineThreshold = 0.5;
    const outlineFuzziness = 0.3;

    function drawTexture() {
        textureCtx.clearRect(0, 0, textureCanvas.width, textureCanvas.height);

        // --- Draw Grain ---
        // Grain density (higher value = more dense grain, more intense)
        const grainDensity = 0.05; // Adjust this value (e.g., 0.01 for very subtle, 0.1 for more prominent)
        for (let i = 0; i < textureCanvas.width * textureCanvas.height * grainDensity; i++) {
            const x = Math.random() * textureCanvas.width;
            const y = Math.random() * textureCanvas.height;
            // Randomize color slightly for subtle variations
            const grayValue = Math.floor(180 + Math.random() * 75); // Light to medium gray
            // Alpha for grain (higher value = more opaque, more intense grain)
            const alpha = 0.1 + Math.random() * 0.1; // Adjust the base (0.1) and range (0.1) for intensity
            textureCtx.fillStyle = `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${alpha})`;
            textureCtx.fillRect(x, y, 1, 1); // Draw a single pixel
        }

        // --- Draw Scratches ---
        const numScratches = 20; // Number of scratches on the paper texture
        const scratchLength = 50; // Max length of a scratch
        const scratchWidth = 1.5; // Max width of a scratch

        for (let i = 0; i < numScratches; i++) {
            const x1 = Math.random() * textureCanvas.width;
            const y1 = Math.random() * textureCanvas.height;
            const angle = Math.random() * Math.PI * 2; // Random angle for the scratch
            const length = Math.random() * scratchLength + 10; // Random length
            const width = Math.random() * scratchWidth + 0.5; // Random width

            const x2 = x1 + length * Math.cos(angle);
            const y2 = y1 + length * Math.sin(angle);

            const grayValue = Math.floor(100 + Math.random() * 50); // Darker gray for scratches
            // Alpha for scratches (higher value = more opaque, more intense scratches)
            const alpha = 0.2 + Math.random() * 0.2; // Adjust the base (0.2) and range (0.2) for intensity
            textureCtx.strokeStyle = `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${alpha})`;
            textureCtx.lineWidth = width;
            textureCtx.lineCap = 'round'; // Rounded ends for scratches

            textureCtx.beginPath();
            textureCtx.moveTo(x1, y1);
            textureCtx.lineTo(x2, y2);
            textureCtx.stroke();
        }

        // --- Draw Vignette ---
        const centerX = textureCanvas.width / 2;
        const centerY = textureCanvas.height / 2;
        const maxDim = Math.max(textureCanvas.width, textureCanvas.height);
        const innerRadius = maxDim * 0.4;
        const outerRadius = maxDim * 0.7;

        const gradient = textureCtx.createRadialGradient(
            centerX, centerY, innerRadius,
            centerX, centerY, outerRadius
        );

        // Adjust these color stops for vignette intensity and color
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');     // Transparent in the center
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.75)'); // Slightly dark closer to edges
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1.5)');   // Darker at the very edges

        textureCtx.fillStyle = gradient;
        textureCtx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
    }

    function getNoiseValue(x, y, t) {
        let value = Math.sin(x * scale + t) * 0.5 +
                    Math.sin(y * scale * 0.8 + t * 0.7) * 0.5 +
                    Math.sin((x + y) * scale * 0.6 + t * 1.2) * 0.5;
        value = Math.pow(Math.abs(value), sharpness);
        return value;
    }

    function drawNoise() {
        const width = noiseCanvas.width;
        const height = noiseCanvas.height;
        const imageData = noiseCtx.createImageData(width, height);
        const data = imageData.data;

        const noiseMap = new Array(width);
        for (let x = 0; x < width; x++) {
            noiseMap[x] = new Array(height);
            for (let y = 0; y < height; y++) {
                noiseMap[x][y] = getNoiseValue(x, y, time);
            }
        }

        // pixle
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const noise = noiseMap[x][y];
                const index = (y * width + x) * 4;

                let r, g, b, a;
                const currentColorIsBlue = noise > outlineThreshold;

                let isOutline = false;
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue; // Skip self

                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const neighborNoise = noiseMap[nx][ny];
                            const neighborColorIsBlue = neighborNoise > outlineThreshold;

                            if (
                                (noise > (outlineThreshold - outlineFuzziness) && neighborNoise <= (outlineThreshold + outlineFuzziness)) ||
                                (noise <= (outlineThreshold + outlineFuzziness) && neighborNoise > (outlineThreshold - outlineFuzziness))
                            ) {
                                isOutline = true;
                                break; // Found an edge
                            }
                        }
                    }
                    if (isOutline) break; // Found an edge, exit outer loop
                }

                if (isOutline) {
                    r = 89; g = 114; b = 222;
                    a = 255;
                } else {
                    // Original blue/white colors
                    if (currentColorIsBlue) {
                        r = 7; g = 54; b = 254; // Blue
                    } else {
                        r = 255; g = 255; b = 255; // White
                    }
                    a = 255; // Fully opaque
                }

                data[index] = r;
                data[index + 1] = g;
                data[index + 2] = b;
                data[index + 3] = a;
            }
        }
        noiseCtx.putImageData(imageData, 0, 0);

        for (let i = 0; i < numNoiseScratches; i++) {
            noiseCtx.beginPath();
            const x1 = Math.random() * width;
            const y1 = Math.random() * height;
            const x2 = x1 + (Math.random() * 200 - 100);
            const y2 = y1 + (Math.random() * 200 - 100);

            noiseCtx.moveTo(x1, y1);
            noiseCtx.lineTo(x2, y2);

            const scratchColor = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(173, 216, 230, 0.4)';
            noiseCtx.strokeStyle = scratchColor;
            noiseCtx.lineWidth = Math.random() * 1.5 + 0.5;
            noiseCtx.stroke();
        }
    }
    function handleResize() {
        textureCanvas.width = window.innerWidth;
        textureCanvas.height = window.innerHeight;
        noiseCanvas.width = window.innerWidth;
        noiseCanvas.height = window.innerHeight;

        drawTexture();
        drawNoise();
    }

    function animateNoise() {
        time += speed;
        drawNoise();
        requestAnimationFrame(animateNoise);
    }


    handleResize();
    window.addEventListener('resize', handleResize);
    animateNoise();
});
