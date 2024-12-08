import { skinManager } from './skinManager.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Iniciando carga del juego...');
        
        
        const osuContent = sessionStorage.getItem('osuContent');
        console.log('¿Hay contenido OSU?:', !!osuContent);
        
        if (!osuContent) {
            throw new Error('No hay contenido OSU en sessionStorage');
        }

        
        console.log('Intentando cargar el audio...');
        const audioBlob = await getAudioBlob();
        console.log('¿Se obtuvo el audioBlob?:', !!audioBlob);
        
        if (!audioBlob) {
            throw new Error('No se pudo obtener el audio de IndexedDB');
        }

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        console.log('Audio creado, configurando eventos...');

        
        const difficultyLabel = document.getElementById('difficultyLabel');
        if (difficultyLabel) {
            difficultyLabel.textContent = 'DIFICULTAD: LEGEND';
        }

        audio.addEventListener('canplay', () => {
            console.log('Audio listo para reproducir');
            const hitObjects = parseOsuMap(osuContent);
            console.log('Objetos parseados:', hitObjects.length);
            audio.play();
            startGame(hitObjects, audio);
        });

        audio.addEventListener('error', (e) => {
            console.error('Error específico del audio:', e.target.error);
            throw new Error(`Error al cargar el audio: ${e.target.error.message}`);
        });

    } catch (error) {
        console.error('Error detallado al iniciar el juego:', error);
        console.error('Stack trace:', error.stack);
        alert('Error al cargar el juego. Volviendo a la selección.');
        window.location.href = 'select.html';
    }
});

async function getAudioBlob() {
    try {
        const request = indexedDB.open('gameDB');
        
        return new Promise((resolve, reject) => {
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('audioFiles', 'readonly');
                const store = tx.objectStore('audioFiles');
                
                const getRequest = store.get('currentAudio');
                
                getRequest.onsuccess = () => {
                    if (getRequest.result) {
                        resolve(getRequest.result);
                    } else {
                        reject(new Error('No se encontró el archivo de audio'));
                    }
                };
                
                getRequest.onerror = () => reject(getRequest.error);
            };
        });
    } catch (error) {
        console.error('Error al obtener el audio:', error);
        throw error;
    }
}

function startGame(hitObjects, audio) {
    console.log('Iniciando juego con', hitObjects.length, 'notas');
    const columns = document.querySelectorAll('.column');

    const interval = setInterval(() => {
        const currentTime = audio.currentTime * 1000;

        hitObjects.forEach((hit, index) => {
            if (currentTime >= hit.time - 400 && currentTime <= hit.time + 100) {
                console.log(`Generando nota en columna ${hit.column} en tiempo ${currentTime}`);
                spawnNote(columns[hit.column]);
                hitObjects.splice(index, 1);
            }
        });

        if (!hitObjects.length) {
            console.log('Todas las notas procesadas');
            clearInterval(interval);
        }
    }, 16);
}


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
            continue; 
        }
        if (line.startsWith('[') && inHitObjectsSection) break;

        if (inHitObjectsSection && line) {
            const parts = line.split(',');
            if (parts.length < 3) {
                console.warn("Línea malformada en [HitObjects]:", line);
                continue;
            }

            const [x, , time] = parts.map(Number);
            const column = Math.floor((x / 512) * 4); 
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


function spawnNote(column) {
    const note = document.createElement('div');
    note.classList.add('note');
    note.style.top = '0px'; 
    column.appendChild(note);

    const direction = column.getAttribute('data-direction');
    note.classList.add(direction);  

    column.appendChild(note);

    moveNoteDown(note);
}

function moveNoteDown(note) {
    let position = 0;
    const noteSpeed = 15; 
    const interval = setInterval(() => {
        position += noteSpeed; 
        note.style.top = `${position}px`;

        if (position > 540) { 
            console.log('Nota eliminada: salió de la pantalla.');
            clearInterval(interval);
            note.remove();
        }
    }, 20);
}


function showJudgement(type) {
    console.log('Mostrando judgement:', type);
    const judgementDisplay = document.getElementById('judgementDisplay');
    if (!judgementDisplay) {
        console.error('No se encontró el elemento judgementDisplay');
        return;
    }

    const judgement = document.createElement('div');
    judgement.className = 'judgement';
    
    
    const img = document.createElement('img');
    img.src = `./assets/skins/${type.toLowerCase()}.png`; 
    img.style.width = 'auto';  
    img.style.height = '50px'; 
    
    
    img.onerror = () => {
        console.warn(`No se pudo cargar la imagen para: ${type}`);
        judgement.textContent = type.toUpperCase();
        judgement.style.color = {
            'sick': '#00ff00',
            'good': '#ffff00',
            'bad': '#ff9900',
            'shit': '#ff0000'
        }[type.toLowerCase()] || '#ffffff';
    };

    judgement.appendChild(img);
    
    
    judgementDisplay.innerHTML = '';
    judgementDisplay.appendChild(judgement);
    
    
    setTimeout(() => {
        if (judgement.parentNode === judgementDisplay) {
            judgement.remove();
        }
    }, 500);
}

function updateScoreDisplay(score) {
    const scoreStr = score.toString().padStart(3, '0');
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (!scoreDisplay) {
        console.error('No se encontró scoreDisplay');
        return;
    }

    scoreDisplay.innerHTML = '';
    
    scoreStr.split('').forEach(num => {
        const imgContainer = document.createElement('div');
        imgContainer.style.display = 'inline-block';
        
        const img = document.createElement('img');
        img.src = `./assets/skins/num${num}.png`;
        img.style.height = '40px'; 
        img.style.width = 'auto';
        
        img.onerror = () => {
            console.warn(`No se pudo cargar la imagen del número: ${num}`);
            imgContainer.textContent = num; 
        };
        
        imgContainer.appendChild(img);
        scoreDisplay.appendChild(imgContainer);
    });
}

let currentScore = 0;
function updateScore(points) {
    currentScore += points;
    updateScoreDisplay(currentScore);
}

function showHitValue(value) {
    const hitValueDisplay = document.createElement('div');
    hitValueDisplay.className = 'hit-value';
    hitValueDisplay.style.position = 'absolute';
    hitValueDisplay.style.zIndex = '1000';
    
    const valueString = value.toString();
    for (let digit of valueString) {
        const digitImg = document.createElement('img');
        digitImg.src = `./assets/skins/num${digit}.png`;
        digitImg.style.height = '20px';
        digitImg.style.width = 'auto';
        hitValueDisplay.appendChild(digitImg);
    }
    
    const judgementDisplay = document.getElementById('judgementDisplay');
    if (judgementDisplay) {
        hitValueDisplay.style.top = '60%';
        hitValueDisplay.style.left = '50%';
        hitValueDisplay.style.transform = 'translate(-50%, -50%)';
        judgementDisplay.appendChild(hitValueDisplay);
        
        setTimeout(() => {
            hitValueDisplay.remove();
        }, 500);
    }
}


document.addEventListener('keydown', (event) => {
    const columns = document.querySelectorAll('.column');
    const column = Array.from(columns).find(col => col.getAttribute('data-key') === event.key);
    
    if (!column) return;
    
    const note = column.querySelector('.note');
    if (!note) return;

    const position = parseInt(note.style.top, 10);
    console.log('Posición de la nota:', position);

    if (position === 480) {
        console.log('¡MARVELOUS!');
        showJudgement('marvelous');
        updateScore(500);
        showHitValue(500);
        note.remove();
    } else if (position >= 460 && position <= 500) {
        console.log('¡SICK!');
        showJudgement('sick');
        updateScore(300);
        showHitValue(300);
        note.remove();
    } else if (position >= 440 && position < 460) {
        console.log('¡GOOD!');
        showJudgement('good');
        updateScore(100);
        showHitValue(100);
        note.remove();
    } else if (position >= 400 && position < 440) {
        console.log('¡BAD!');
        showJudgement('bad');
        updateScore(50);
        showHitValue(50);
        note.remove();
    } else {
        console.log('¡SHIT!');
        showJudgement('shit');
        showHitValue(0);
        if (note.parentElement) note.remove();
    }
});

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('gameDB', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('audioFiles')) {
                db.createObjectStore('audioFiles');
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function saveToIndexedDB(storeName, id, data) {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            store.put({ id, data });

            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
        });
    });
}

function getFromIndexedDB(storeName, id) {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result ? request.result.data : null);
            request.onerror = (event) => reject(event.target.error);
        });
    });
}




let consecutiveHits = 0; 
const maxHits = 5; 

const baseImage = document.getElementById('character-base');
const fireImage = document.getElementById('character-fire');

// // Función para manejar los aciertos
function handleHit(isCorrect) {
    if (isCorrect) {
        consecutiveHits++;
        console.log(`Aciertos consecutivos: ${consecutiveHits}`);
        
//         
        if (consecutiveHits === maxHits) {
            activateFireEffect();
        }
    } else {
        consecutiveHits = 0; 
        deactivateFireEffect();
    }
}


function activateFireEffect() {
    fireImage.classList.add('fire-effect'); 
    console.log("¡Fuego activado!");
}


function deactivateFireEffect() {
    fireImage.classList.remove('fire-effect'); 
    console.log("Fuego desactivado.");
}


const style = document.createElement('style');
style.textContent = `
    .judgement {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        z-index: 1000;
        animation: fadeIn 0.1s ease-in, fadeOut 0.4s ease-out 0.1s;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

