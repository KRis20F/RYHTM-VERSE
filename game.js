document.addEventListener('DOMContentLoaded', () => {
    const selectedDifficulty = sessionStorage.getItem('selectedDifficulty');
    const osuContent = sessionStorage.getItem('osuContent');
    const audioData = sessionStorage.getItem('audioData');

    // Validar que los datos necesarios estén presentes
    if (!selectedDifficulty || !osuContent || !audioData) {
        alert('Por favor, selecciona una dificultad primero.');
        window.location.href = 'select.html';
        return;
    }

    document.getElementById('difficultyLabel').textContent = `Dificultad: ${selectedDifficulty}`;

    // Parsear el archivo .osu para obtener los objetos
    const hitObjects = parseOsuMap(osuContent);

    // Crear el objeto de audio usando el Base64 almacenado
    const audio = new Audio(audioData);

    // Depurar audio para asegurar que se cargue correctamente
    audio.addEventListener('canplay', () => {
        console.log('Audio cargado correctamente. Reproduciendo...');
        audio.play();
        startGame(hitObjects, audio);
    });

    audio.addEventListener('error', () => {
        console.error('Error al cargar el audio. Verifica que el archivo .mp3 sea válido.');
    });
});

// Parsear el archivo .osu para obtener las notas (HitObjects)
function parseOsuMap(osuText) {
    const lines = osuText.split('\n');
    const hitObjects = [];
    let inHitObjectsSection = false;

    console.log("Procesando el archivo .osu...");

    for (let line of lines) {
        line = line.trim();
        if (line === '[HitObjects]') {
            console.log("Sección [HitObjects] encontrada.");
            inHitObjectsSection = true;
            continue; // Saltar esta línea
        }
        if (line.startsWith('[') && inHitObjectsSection) break;

        if (inHitObjectsSection && line) {
            const parts = line.split(',');
            if (parts.length < 3) {
                console.warn("Línea malformada en [HitObjects]:", line);
                continue;
            }

            const [x, , time] = parts.map(Number);
            const column = Math.floor((x / 512) * 4); // Asumiendo 4 columnas
            hitObjects.push({ time, column });
        }
    }

    if (hitObjects.length === 0) {
        console.error("No se encontraron objetos en [HitObjects].");
    } else {
        console.log("Objetos encontrados:", hitObjects.length);
    }

    return hitObjects;
}

// Iniciar el juego
function startGame(hitObjects, audio) {
    const columns = document.querySelectorAll('.column');
    const interval = setInterval(() => {
        const currentTime = audio.currentTime * 1000; // Convertir tiempo a milisegundos
        console.log(`Tiempo actual del audio: ${currentTime}`);

        hitObjects.forEach((hit, index) => {
            // console.log(`Revisando nota: tiempo=${hit.time}, columna=${hit.column}`);
            if (currentTime >= hit.time - 400 && currentTime <= hit.time + 100) {
                spawnNote(columns[hit.column]);
                hitObjects.splice(index, 1); // Eliminar la nota procesada
            }
        });

        if (!hitObjects.length) {
            console.log("Todas las notas se han procesado.");
            clearInterval(interval);
        }
    }, 10);
}

// Crear y mover las notas
function spawnNote(column) {
    if (!column) {
        console.error("Columna no válida para spawnNote.");
        return;
    }


    const note = document.createElement('div');
    note.classList.add('note');
    note.style.top = '0px'; // Posición inicial
    column.appendChild(note);

    console.log(`Nota creada en columna.`);

    
    const direction = column.getAttribute('data-direction');
    note.classList.add(direction);  // Esto agrega 'down', 'up', 'left', o 'right'

    column.appendChild(note);
    moveNoteDown(note);

    // Mover nota hacia abajo
    moveNoteDown(note);

    console.log(note + "resultado");
}

function moveNoteDown(note) {
    let position = 0;
    const noteSpeed = 15; // Velocidad de las notas
    const interval = setInterval(() => {
        position += noteSpeed; // Actualizar la posición de la nota
        note.style.top = `${position}px`;

        if (position > 540) { // Si la nota sale de la pantalla
            console.log('Nota eliminada: salió de la pantalla.');
            clearInterval(interval);
            note.remove();
        }
    }, 20);
}

// Detectar si la tecla presionada corresponde a una columna
document.addEventListener('keydown', (event) => {
    const columns = document.querySelectorAll('.column');
    const column = Array.from(columns).find(col => col.getAttribute('data-key') === event.key);
    const note = column ? column.querySelector('.note') : null;

    if (note) {
        const notePosition = parseInt(note.style.top, 10);
        console.log(`Posición de la nota al presionar: ${notePosition}`);

        if (notePosition >= 460 && notePosition <= 500) {
            console.log('¡Acierto!');
            note.remove();
        } if (note.parentElement) note.remove(); // Verificar que la nota exista antes de eliminarla
        } else if (notePosition < 460) {
            console.log('Acierto temprano, nota eliminada');
            if (note.parentElement) note.remove();
        } else if (notePosition > 500) {
            console.log('Acierto tardío, nota eliminada');
            if (note.parentElement) note.remove();
        }else {
            console.log('¡Fallo!');
        }
    }
);
