const dragDropContainer = document.querySelector('.drag-drop-container');
const dropZone = document.querySelector('.drop-zone-1');
const textBox = document.querySelector('.text-box');

dragDropContainer.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', event.target.alt);
});

dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('text/plain');
    textBox.value = data;
    const img = document.createElement('img');
    img.src = event.dataTransfer.getData('text/plain');
    dropZone.innerHTML = '';
    dropZone.appendChild(img);
    img.style.width = '100%';
    img.style.height = '100%';
});
