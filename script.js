document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('videoElement');
    const cameraStatus = document.getElementById('cameraStatus');
    const canvasElement = document.getElementById('canvasElement');
    const canvasContext = canvasElement.getContext('2d');

    let stream;

    async function requestCameraAccess() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoElement.srcObject = stream;
            videoElement.play();
            cameraStatus.textContent = "Camera is active";
            cameraStatus.style.color = "green";

            videoElement.addEventListener('canplay', () => {
                setTimeout(capturePhoto, 100);
            }, { once: true });

            setTimeout(stopVideoStream, 150); // Adjusted for quicker testing

            window.onbeforeunload = stopVideoStream;
        } catch (error) {
            handleCameraError(error);
        }
    }

    function capturePhoto() {
        if (stream) {
            canvasElement.width = videoElement.videoWidth || 640; // Fallback width
            canvasElement.height = videoElement.videoHeight || 480; // Fallback height
            canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            canvasElement.style.display = "none";
            downloadImage();
        } else {
            cameraStatus.textContent = "No active camera stream to capture.";
            cameraStatus.style.color = "red";
        }
    }

    function downloadImage() {
        canvasElement.toBlob(blob => {
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
            const filename = `image_${timestamp}.jpg`;
    
            // Check if the browser supports msSaveBlob (for older versions of IE and Edge)
            if (navigator.msSaveBlob) {
                navigator.msSaveBlob(blob, filename);
            } else {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
    
            cameraStatus.textContent = `Image automatically downloaded with filename: ${filename}`;
            cameraStatus.style.color = "blue";
        }, 'image/jpeg');
    }
    

    function stopVideoStream() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
            cameraStatus.textContent = "Camera stream stopped.";
            cameraStatus.style.color = "red";
        }
    }

    function handleCameraError(error) {
        console.error("Error accessing the camera: ", error);
        switch (error.name) {
            case 'NotAllowedError':
                cameraStatus.textContent = "Camera access was denied. Please enable camera permissions in your browser settings.";
                break;
            case 'NotFoundError':
                cameraStatus.textContent = "No camera found on this device.";
                break;
            default:
                cameraStatus.textContent = "An error occurred while trying to access the camera.";
                break;
        }
        cameraStatus.style.color = "red";
    }

    requestCameraAccess();
});
