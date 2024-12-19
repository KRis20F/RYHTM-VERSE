import { skinManager } from './skinManager.js';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

let interval;
let audio;
let currentCombo = 0;
let maxCombo = 0;
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const osuContent = sessionStorage.getItem('osuContent');
        
        const audioBlob = await getAudioBlob();

        const audioUrl = URL.createObjectURL(audioBlob);
        audio = new Audio(audioUrl);
        
        const difficultyLabel = document.getElementById('difficultyLabel');
        if (difficultyLabel) {
            const selectedDifficulty = sessionStorage.getItem('difficultyCategory') || 'EASY';
            difficultyLabel.textContent = `DIFICULTAD: ${selectedDifficulty.toUpperCase()}`;
        }

        audio.addEventListener('canplay', () => {
            const hitObjects = parseOsuMap(osuContent);
            audio.play();
            startGame(hitObjects, audio);
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
    const columns = document.querySelectorAll('.column');

    const ranges = isMobile ? {
        marvelous: { min: 420, max: 480 },
        sick: { min: 400, max: 500 },
        good: { min: 360, max: 520 },
        bad: { min: 320, max: 560 }
    } : {
        marvelous: { min: 440, max: 460 },
        sick: { min: 420, max: 480 },
        good: { min: 380, max: 420 },
        bad: { min: 340, max: 380 }
    };

    interval = setInterval(() => {
        const currentTime = audio.currentTime * 1000;

        hitObjects.forEach((hit, index) => {
            if (currentTime >= hit.time - 400 && currentTime <= hit.time + 100) {
                spawnNote(columns[hit.column]);
                hitObjects.splice(index, 1);
            }
        });

        if (!hitObjects.length) {
            clearInterval(interval);
        }
    }, 16);
}


function parseOsuMap(osuText) {
    const lines = osuText.split('\n');
    const hitObjects = [];
    let inHitObjectsSection = false;

    for (let line of lines) {
        line = line.trim();
        if (line === '[HitObjects]') {
            inHitObjectsSection = true;
            continue; 
        }

        if (line.startsWith('[') && inHitObjectsSection) break;

        if (inHitObjectsSection && line) {
            const parts = line.split(',');
            if (parts.length < 3) {
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
            clearInterval(interval);
            note.remove();
        }
    }, 20);
}


function showJudgement(type) {
    const judgementDisplay = document.getElementById('judgementDisplay');

    const judgement = document.createElement('div');
    judgement.className = 'judgement';
    
    
    const img = document.createElement('img');
    img.src = `./assets/skins/${type.toLowerCase()}.png`; 
    img.style.width = 'auto';  
    img.style.height = '50px'; 
    
    
    img.onerror = () => {
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

    if (!scoreDisplay.querySelector('.score-numbers')) {
        const numbersContainer = document.createElement('div');
        numbersContainer.className = 'score-numbers';
        numbersContainer.style.display = 'inline-flex';
        numbersContainer.style.marginLeft = '175px';
        numbersContainer.style.marginTop = '30px';
        scoreDisplay.appendChild(numbersContainer);
    }

    const numbersContainer = scoreDisplay.querySelector('.score-numbers');
    numbersContainer.innerHTML = '';
    
    scoreStr.split('').forEach(num => {
        const imgContainer = document.createElement('div');
        imgContainer.style.display = 'inline-block';
        
        const img = document.createElement('img');
        img.src = `./assets/skins/num${num}.png`;
        img.style.height = '40px'; 
        img.style.width = 'auto';
        
        img.onerror = () => {
            imgContainer.textContent = num; 
        };
        
        imgContainer.appendChild(img);
        numbersContainer.appendChild(imgContainer);
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
        hitValueDisplay.style.top = '55%';
        hitValueDisplay.style.left = '40%';
        hitValueDisplay.style.transform = 'translate(-50%, -50%)';
        judgementDisplay.appendChild(hitValueDisplay);
        
        setTimeout(() => {
            hitValueDisplay.remove();
        }, 500);
    }
}


function handleInput(column) {
    const note = column.querySelector('.note');
    if (!note) return;

    const position = parseInt(note.style.top, 10);
    let isCorrect = false;

    const ranges = isMobile ? {
        marvelous: { min: 420, max: 480 },
        sick: { min: 400, max: 500 },
        good: { min: 360, max: 520 },
        bad: { min: 320, max: 560 }
    } : {
        marvelous: { min: 440, max: 460 },
        sick: { min: 420, max: 480 },
        good: { min: 380, max: 420 },
        bad: { min: 340, max: 380 }
    };

    if (position >= ranges.marvelous.min && position <= ranges.marvelous.max) {
        showJudgement('marvelous');
        updateScore(500);
        showHitValue(500);
        isCorrect = true;
    } else if (position >= ranges.sick.min && position <= ranges.sick.max) {
        showJudgement('sick');
        updateScore(300);
        showHitValue(300);
        isCorrect = true;
    } else if (position >= ranges.good.min && position <= ranges.good.max) {
        showJudgement('good');
        updateScore(100);
        showHitValue(100);
        isCorrect = true;
    } else if (position >= ranges.bad.min && position <= ranges.bad.max) {
        showJudgement('bad');
        updateScore(50);
        showHitValue(50);
        isCorrect = true;
    } else {
        showJudgement('shit');
        showHitValue(0);
        currentCombo = 0;
    }

    if (isCorrect) {
        currentCombo++;
        maxCombo = Math.max(maxCombo, currentCombo);
        note.remove();
    } else if (note.parentElement) {
        note.remove();
    }

    updateComboDisplay();
    handleHit(isCorrect);

    if (!isCorrect) {
        consecutiveHits = 0;
        deactivateFireEffect();
        loseLife();
    }
}

if (isMobile) {
    const columns = document.querySelectorAll('.column');
    columns.forEach(column => {
        column.addEventListener('touchstart', (event) => {
            event.preventDefault();
            handleInput(column);
        });
    });
} else {
    document.addEventListener('keydown', (event) => {
        const columns = document.querySelectorAll('.column');
        const column = Array.from(columns).find(col => col.getAttribute('data-key') === event.key);
        if (!column) return;
        handleInput(column);
    });
}

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




let lives = 3; 

function loseLife() {
    if (lives <= 0) return;

    const lifeElement = document.getElementById(`life-${lives}`);
    if (lifeElement) {
        lifeElement.classList.add('burn-life'); 
        setTimeout(() => {
            lifeElement.style.display = 'none'; 
        }, 500); 
    }

    lives--;

    if (lives === 0) {
        endGame(); 
    }
}

const lifeStyle = document.createElement('style');
lifeStyle.textContent = `
    .burn-life {
        animation: burn 0.5s ease-in-out forwards;
    }

    @keyframes burn {
        from {
            transform: scale(1);
            opacity: 1;
        }
        to {
            transform: scale(0.5);
            opacity: 0;
        }
    }
`;
document.head.appendChild(lifeStyle);

function endGame() {
    
    if (audio) {
        audio.pause(); 
    }
    
    clearInterval(interval); 
    
    setTimeout(() => {
        window.location.href = 'endgame.html'; 
    }, 300);
}



let consecutiveHits = 0; 
const maxHits = 5; 

const baseImage = document.getElementById('character-base');
const fireImage = document.getElementById('character-fire');

// // Función para manejar los aciertos
function handleHit(isCorrect) {
    if (isCorrect) {
        consecutiveHits++;

        if (consecutiveHits === maxHits) {
            activateFireEffect();
        }
    } else {
        consecutiveHits = 0; 
        deactivateFireEffect();
    }
}


function activateFireEffect() {fireImage.classList.add('fire-effect'); }


function deactivateFireEffect() {fireImage.classList.remove('fire-effect'); }


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

function updateComboDisplay() {
    let comboDisplay = document.getElementById('comboDisplay');
    if (!comboDisplay) {
        const comboDiv = document.createElement('div');
        comboDiv.id = 'comboDisplay';
        comboDiv.className = 'combo-display';
        document.body.appendChild(comboDiv);
        comboDisplay = document.getElementById('comboDisplay');
    }

    if (currentCombo > 0) {
        comboDisplay.innerHTML = `
            <img src="./assets/skins/combo.png" class="combo-text" alt="combo">
            <div class="combo-numbers"></div>
        `;
        
        const comboNumbers = comboDisplay.querySelector('.combo-numbers');
        const comboStr = currentCombo.toString();
        
        comboStr.split('').forEach(num => {
            const imgContainer = document.createElement('div');
            imgContainer.style.display = 'inline-block';
            
            const img = document.createElement('img');
            img.src = `./assets/skins/num${num}.png`;
            img.style.height = '30px';
            img.style.width = 'auto';
            
            img.onerror = () => {
                imgContainer.textContent = num;
            };
            
            imgContainer.appendChild(img);
            comboNumbers.appendChild(imgContainer);
        });
        
        comboDisplay.style.display = 'block';
        comboDisplay.classList.add('combo-pop');
        setTimeout(() => comboDisplay.classList.remove('combo-pop'), 100);
    } else {
        comboDisplay.style.display = 'none';
    }
}

const comboStyle = document.createElement('style');
comboStyle.textContent = `
    .combo-display {
        position: fixed;
        top: 35%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 24px;
        font-weight: bold;
        color: white;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: transparent !important;
        border: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
    }

    .combo-text {
        height: 30px;
        width: auto;
        margin-bottom: 5px;
        filter: drop-shadow(2px 2px 1px rgb(78, 7, 92)) 
                drop-shadow(2px 2px 1px rgb(248, 59, 255));
    }

    .combo-numbers img {
        height: 45px !important;
        filter: drop-shadow(2px 2px 1px rgb(78, 7, 92)) 
                drop-shadow(2px 2px 1px rgb(248, 59, 255));
    }

    .combo-pop {
        animation: comboPop 0.1s ease-out;
    }
`;
document.head.appendChild(comboStyle);

const mobileStyle = document.createElement('style');
mobileStyle.textContent = `
    @media (max-width: 780px) {
        .column {
            touch-action: none;
        }

        .game-container {
            touch-action: none;
        }

        .note {
            width: 40px !important;
            height: 40px !important;
            left: 10px !important;
        }
    }
`;
document.head.appendChild(mobileStyle);

