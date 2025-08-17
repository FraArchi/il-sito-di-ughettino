const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('image-upload');
const stickersContainer = document.getElementById('stickers');
const downloadBtn = document.getElementById('download-btn');

let baseImage = null;
const stickersOnCanvas = [];
let stickerFiles = ['../Immagini/impronta stupenda.jpg', '../Immagini/Ugo.jpeg']; // Esempi di stickers

// Carica stickers
stickerFiles.forEach(stickerFile => {
    const img = document.createElement('img');
    img.src = stickerFile;
    img.classList.add('sticker');
    img.addEventListener('click', () => addSticker(stickerFile));
    stickersContainer.appendChild(img);
});

imageUpload.addEventListener('change', e => {
    const reader = new FileReader();
    reader.onload = event => {
        baseImage = new Image();
        baseImage.onload = () => {
            canvas.width = baseImage.width;
            canvas.height = baseImage.height;
            redrawCanvas();
        };
        baseImage.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

function addSticker(stickerSrc) {
    if (!baseImage) {
        alert("Carica prima un'immagine di base!");
        return;
    }
    const sticker = {
        img: new Image(),
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        isDragging: false
    };
    sticker.img.src = stickerSrc;
    sticker.img.onload = () => {
        stickersOnCanvas.push(sticker);
        redrawCanvas();
    };
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (baseImage) {
        ctx.drawImage(baseImage, 0, 0);
    }
    stickersOnCanvas.forEach(sticker => {
        ctx.drawImage(sticker.img, sticker.x, sticker.y, sticker.width, sticker.height);
    });
}

// Drag and drop per gli stickers
let activeSticker = null;

canvas.addEventListener('mousedown', e => {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    activeSticker = null;
    for (let i = stickersOnCanvas.length - 1; i >= 0; i--) {
        const s = stickersOnCanvas[i];
        if (mouseX > s.x && mouseX < s.x + s.width && mouseY > s.y && mouseY < s.y + s.height) {
            activeSticker = s;
            activeSticker.isDragging = true;
            break;
        }
    }
});

canvas.addEventListener('mousemove', e => {
    if (activeSticker && activeSticker.isDragging) {
        activeSticker.x = e.offsetX - activeSticker.width / 2;
        activeSticker.y = e.offsetY - activeSticker.height / 2;
        redrawCanvas();
    }
});

canvas.addEventListener('mouseup', () => {
    if(activeSticker) activeSticker.isDragging = false;
});

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'ugo-photobooth.png';
    link.href = canvas.toDataURL();
    link.click();
});
