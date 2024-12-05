// const columns = document.querySelectorAll('.column');
// const speed = 12; // Velocidad de las notas
// const audio = new Audio(''); // Ruta del archivo de sonido
// audio.loop = false; // No se reinicia automáticamente
// let isPlaying = false; // Indicador del estado de reproducción de la canción

// // Iniciar la canción al cargar el juego
// function startMusic() {
//     audio.play();
//     isPlaying = true;
// }

// // Reanudar la canción después de una interrupción
// function resumeMusic() {
//     if (!isPlaying) {
//         audio.play();
//         isPlaying = true;
//     }
// }

// // Pausar momentáneamente la canción para dar el efecto de corte
// function cutMusic() {
//     audio.pause();
//     isPlaying = false;
//     setTimeout(resumeMusic, 100); // Corto de 100 ms antes de reanudar
// }

// // Crear una nota y asignar su dirección según la columna
// function createNote(column) {
//     const note = document.createElement('div');
//     note.classList.add('note');

//     // Asignar la dirección de la nota según la columna
//     const direction = column.getAttribute('data-direction');
//     note.classList.add(direction);

//     column.appendChild(note);
//     moveNoteDown(note, column);
// }

// // Mover la nota hacia abajo
// function moveNoteDown(note, column) {
//     let position = 0;
//     const interval = setInterval(() => {
//         position += speed;
//         note.style.top = position + 'px';

//         // Verificar si la nota llega a la zona de hit
//         if (position > 540) {
//             note.remove();
//             clearInterval(interval);
//         }
//     }, 20);
// }

// // Generar notas en columnas aleatorias
// function spawnNotes() {
//     setInterval(() => {
//         const randomColumn = columns[Math.floor(Math.random() * columns.length)];
//         createNote(randomColumn);
//     }, 500); // Ajusta la frecuencia de aparición
// }

// // Verificar si se presionó la tecla correcta en el momento correcto
// function checkHit(key) {
//     const column = document.querySelector(`.column[data-key="${key}"]`);
//     const note = column.querySelector('.note');

//     // Verificar si hay una nota dentro del área de acierto
//     if (note) {
//         const notePosition = parseInt(note.style.top);

//         // Rango de acierto (ajusta según la precisión deseada)
//         if (notePosition >= 460 && notePosition <= 500) {
//             console.log("¡Acierto perfecto!");
//             note.remove();
//         } else if (notePosition >= 360 && notePosition <= 460) {
//             console.log("Acierto temprano, corte");
//             cutMusic();
//             note.remove();
//         } else if (notePosition > 500 && notePosition <= 600) {
//             console.log("Acierto tardío, corte");
//             cutMusic();
//             note.remove();
//         } else {
//             console.log("Fallaste");
//             cutMusic();
//             note.remove();
//         }
//     }
// }

// // Escuchar teclas para detección de aciertos
// document.addEventListener('keydown', (event) => {
//     checkHit(event.key);
// });

// startMusic(); // Iniciar la música al cargar la página
// spawnNotes(); // Iniciar la generación de notas


//? cambios animacion avatar
// Variables para las imágenes y el contador de aciertos
let consecutiveHits = 0; // Contador de aciertos consecutivos
const maxHits = 5; // Número de aciertos necesarios para activar el fuego

const baseImage = document.getElementById('character-base');
const fireImage = document.getElementById('character-fire');

// Función para manejar los aciertos
function handleHit(isCorrect) {
    if (isCorrect) {
        consecutiveHits++;
        console.log(`Aciertos consecutivos: ${consecutiveHits}`);
        
        // Activa el fuego si se alcanzan los aciertos necesarios
        if (consecutiveHits === maxHits) {
            activateFireEffect();
        }
    } else {
        consecutiveHits = 0; // Reinicia el contador en caso de fallo
        deactivateFireEffect();
    }
}

// Activar efecto de fuego
function activateFireEffect() {
    fireImage.classList.add('fire-effect'); // Activa la animación
    console.log("¡Fuego activado!");
}

// Desactivar efecto de fuego
function deactivateFireEffect() {
    fireImage.classList.remove('fire-effect'); // Detiene la animación
    console.log("Fuego desactivado.");
}

// Simula eventos de aciertos (para pruebas)
/*
    Puedes usar las teclas 'a' (acierto) y 's' (fallo) para probar.
    Reemplaza estas teclas con tu lógica de juego real para detectar aciertos y fallos.
*/
document.addEventListener('keydown', (event) => {
    if (event.key === 'a') { // Ejemplo: tecla 'a' registra un acierto
        handleHit(true);
    } else if (event.key === 's') { // Ejemplo: tecla 's' registra un fallo
        handleHit(false);
    }
});