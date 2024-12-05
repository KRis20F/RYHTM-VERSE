const columns = document.querySelectorAll('.column');
let audio = new Audio(); // Archivo de audio cargado
let hitObjects = []; // Notas del mapa
let startTime = 0; // Tiempo inicial de reproducción

const noteSpeed = 10; // Velocidad de las notas

// Recuperar datos en game.html
document.addEventListener('DOMContentLoaded', () => {
    const osuMap = localStorage.getItem('osuMap');
    const audioBlobBase64 = localStorage.getItem('audioBlob');
    const selectedDifficulty = localStorage.getItem('selectedDifficulty');

    if (!osuMap || !audioBlobBase64 || !selectedDifficulty) {
        alert('No se cargó un archivo o dificultad.');
        window.location.href = 'index.html';
        return;
    }

    audio.src = audioBlobBase64;
    audio.addEventListener('loadeddata', () => {
        console.log('Audio listo.');
    });

    parseOsuMap(osuMap);
    startGame();
});

// Parsear mapa
function parseOsuMap(osuText) {
    const lines = osuText.split('\n');
    let inHitObjectsSection = false;

    for (let line of lines) {
        line = line.trim();
        if (line === '[HitObjects]') {
            inHitObjectsSection = true;
            continue;
        }
        if (line.startsWith('[') && inHitObjectsSection) {
            inHitObjectsSection = false;
        }
        if (inHitObjectsSection && line) {
            const [x, , time] = line.split(',').map(val => parseInt(val));
            const column = Math.floor((x / 512) * columns.length);
            hitObjects.push({ time, column });
        }
    }
    console.log('Notas cargadas:', hitObjects);
}

function startGame() {
    startMusic();
    renderNotes();
}

function startMusic() {
    startTime = Date.now();
    audio.play();
}

function renderNotes() {
    const interval = setInterval(() => {
        const currentTime = Date.now() - startTime;
        hitObjects.forEach((hit, index) => {
            if (currentTime >= hit.time - 200 && currentTime <= hit.time + 200) {
                spawnNote(hit.column);
                hitObjects.splice(index, 1);
            }
        });

        if (hitObjects.length === 0) clearInterval(interval);
    }, 20);
}

function spawnNote(columnIndex) {
    const column = columns[columnIndex];
    const note = document.createElement('div');
    note.classList.add('note');
    const direction = column.getAttribute('data-direction');
    note.classList.add(direction);
    column.appendChild(note);
    moveNoteDown(note);
}

function moveNoteDown(note) {
    let position = 0;
    const interval = setInterval(() => {
        position += noteSpeed;
        note.style.top = position + 'px';
        if (position > 540) {
            note.remove();
            clearInterval(interval);
        }
    }, 20);
}

document.addEventListener('keydown', (event) => {
    const column = Array.from(columns).find(col => col.getAttribute('data-key') === event.key);
    const note = column ? column.querySelector('.note') : null;

    if (note) {
        const notePosition = parseInt(note.style.top);
        if (notePosition >= 460 && notePosition <= 500) {
            console.log('¡Acierto!');
            note.remove();
        } else if (notePosition >= 360 && notePosition < 460) {
            console.log('¡Acierto temprano!');
            note.remove();
        } else if (notePosition > 500 && notePosition <= 600) {
            console.log('¡Acierto tardío!');
            note.remove();
        } else {
            console.log('¡Fallo!');
        }
    }
});
