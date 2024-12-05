document.addEventListener('DOMContentLoaded', () => {
    const selectedDifficulty = sessionStorage.getItem('selectedDifficulty');
    const osuContent = sessionStorage.getItem('osuContent');
    const audioUrl = sessionStorage.getItem('audioUrl');

    if (!selectedDifficulty || !osuContent || !audioUrl) {
        alert('Por favor, selecciona una dificultad primero.');
        window.location.href = 'index.html'; // Redirigir si no hay datos
    } else {
        // Mostrar la dificultad seleccionada
        const difficultyLabel = document.getElementById('difficultyLabel');
        if (difficultyLabel) {
            difficultyLabel.textContent = `Dificultad: ${selectedDifficulty}`;
        }

        // Cargar el mapa de notas y asignar el audio
        parseOsuMap(osuContent);
        const audio = new Audio(audioUrl); // Crear un objeto de audio con la URL
        audio.play(); // Reproducir el audio
        startGame(); // Iniciar el juego
    }
});



const columns = document.querySelectorAll('.column');
let audio = new Audio(); // Archivo de audio cargado
let hitObjects = []; // Notas del mapa
let startTime = 0; // Tiempo inicial de reproducción

const noteSpeed = 12; // Velocidad de las notas

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

// Función para iniciar el juego
function startGame() {
    startTime = Date.now();
    renderNotes();
}

function renderNotes() {
    const interval = setInterval(() => {
        const currentTime = Date.now() - startTime;
        hitObjects.forEach((hit, index) => {
            if (currentTime >= hit.time - 200 && currentTime <= hit.time + 200) {
                spawnNote(hit.column);
                hitObjects.splice(index, 1); // Eliminar nota de la lista
            }
        });

        if (hitObjects.length === 0) {
            clearInterval(interval); // Detener el juego cuando se terminen las notas
        }
    }, 10);
}

function spawnNote(columnIndex) {
    const column = columns[columnIndex];
    const note = document.createElement('div');
    note.classList.add('note');
    column.appendChild(note);

    const direction = column.getAttribute('data-direction');
    note.classList.add(direction);  // Esto agrega 'down', 'up', 'left', o 'right'

    column.appendChild(note);
    moveNoteDown(note);

    let notePosition = 0;
    const noteInterval = setInterval(() => {
        if (notePosition < 600) {
            notePosition += noteSpeed;
            note.style.top = notePosition + 'px';
        } else {
            clearInterval(noteInterval); // Eliminar la nota si alcanza el final
            column.removeChild(note);
        }
    }, 10);
}

function moveNoteDown(note) {
    let position = 0;
    const interval = setInterval(() => {
        position += noteSpeed; // Actualizar la posición de la nota
        note.style.top = position + 'px';
        if (position > 540) { // Si la nota ha pasado la parte inferior de la pantalla
            note.remove();
            clearInterval(interval);
        }
    }, 20);
}

// Detectar si la tecla presionada corresponde a una columna y si la nota es un acierto
document.addEventListener('keydown', (event) => {
    const column = Array.from(columns).find(col => col.getAttribute('data-key') === event.key);
    const note = column ? column.querySelector('.note') : null;

    if (note) {
        const notePosition = parseInt(note.style.top);
        if (notePosition >= 460 && notePosition <= 500) { // Rango de acierto
            console.log('¡Acierto!');
            note.remove(); // Eliminar la nota al acertar
        } else {
            console.log('¡Fallo!');
            note.remove(); // Eliminar la nota si se falla
        }
    }
});
