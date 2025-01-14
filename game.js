import { skinManager } from './skinManager.js';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

let interval;
let audio;
let currentCombo = 0;
let maxCombo = 0;
let lives = 3; 

const pressedKeys = new Set();

// Función para precargar imágenes
function preloadImages() {
    const imageUrls = [
        './assets/skins/marvelous.png',
        './assets/skins/sick.png',
        './assets/skins/good.png',
        './assets/skins/bad.png',
        './assets/skins/combo.png',
        './assets/skins/num0.png',
        './assets/skins/num1.png',
        './assets/skins/num2.png',
        './assets/skins/num3.png',
        './assets/skins/num4.png',
        './assets/skins/num5.png',
        './assets/skins/num6.png',
        './assets/skins/num7.png',
        './assets/skins/num8.png',
        './assets/skins/num9.png',
        './assets/skins/shit.png',
    ];

    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    preloadImages();
    try {
        const osuContent = sessionStorage.getItem('osuContent');
        
        const audioBlob = await getAudioBlob();

        const audioUrl = URL.createObjectURL(audioBlob);
        audio = new Audio(audioUrl);
        
        const difficultyLabel = document.getElementById('difficultyLabel');
        if (difficultyLabel) {
            const difficulty = getDifficultyFromContent(osuContent);
            difficultyLabel.textContent = `DIFICULTAD: ${difficulty}`;
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
    
    interval = setInterval(() => {
        const currentTime = audio.currentTime * 1000;
        
        for (let i = hitObjects.length - 1; i >= 0; i--) {
            const hit = hitObjects[i];
            if (currentTime >= hit.time - 300 && currentTime <= hit.time + 100) {
                spawnNote(columns[hit.column]);
                hitObjects.splice(i, 1);
            }
        }
    }, 8);

    audio.addEventListener('ended', () => {
        clearInterval(interval);
        endGame(true);
    });
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
            const column = Math.min(3, Math.max(0, Math.floor((x / 512) * 4))); 
            hitObjects.push({ time, column });
        }
    }


    return hitObjects;
}


function spawnNote(column) {
    const note = document.createElement('div');
    const direction = column.getAttribute('data-direction');
    note.classList.add('note');

    note.style.backgroundImage = `url('./assets/img/nota-${direction}.png')`; 
    
    note.style.top = '0px';
    column.appendChild(note);
    moveNoteDown(note);
}


function moveNoteDown(note) {
    let position = 0;
    const noteSpeed = isMobile ? 6 : 7;
    
    function animate() {
        position += noteSpeed;
        note.style.transform = `translateY(${position}px)`;
        
        const limit = isMobile ? 800 : 600;
        if (position <= limit) {
            requestAnimationFrame(animate);
        } else {
            note.remove();
        }
    }
    
    requestAnimationFrame(animate);
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
        numbersContainer.style.marginLeft = '10px';
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
    const notes = Array.from(column.querySelectorAll('.note'));
    if (!notes.length) return;

    const note = notes[0];
    const position = parseFloat(note.style.transform.split('translateY(')[1]) || 0;

    const ranges = isMobile ? {
        marvelous: { min: 380, max: 460 },
        sick: { min: 340, max: 500 },
        good: { min: 300, max: 540 },
        bad: { min: 260, max: 580 }
    } : {
        marvelous: { min: 440, max: 460 },
        sick: { min: 420, max: 480 },
        good: { min: 380, max: 520 },
        bad: { min: 340, max: 560 }
    };

    let isCorrect = false;

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
        updateScore(0);
        showHitValue(0);
        currentCombo = 0;
        loseLife(); //RAFA, Comentar esto si pierdes, puedas debugear mejor jefe
    }

    if (isCorrect) {
        note.remove();
        currentCombo++;
        maxCombo = Math.max(maxCombo, currentCombo);
        updateComboDisplay();
    }

    handleHit(isCorrect)
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

if (isMobile) {
    const columns = document.querySelectorAll('.column');
    columns.forEach(column => {
        column.addEventListener('touchstart', (event) => {
            event.preventDefault();
            handleInput(column);
        }, { passive: false });
    });
} else {
    const throttledHandleInput = throttle(handleInput, 16);

    const keyMap = {
        'd': 0,
        'f': 1,
        'j': 2,
        'k': 3,
        'a': 0,
        's': 1,
        'w': 2,
        'ArrowLeft': 0,
        'ArrowDown': 1,
        'ArrowUp': 2,
        'ArrowRight': 3
    };

    document.addEventListener('keydown', (event) => {
        if (event.key in keyMap && !pressedKeys.has(event.key)) {
            pressedKeys.add(event.key);
            const columns = document.querySelectorAll('.column');
            const column = columns[keyMap[event.key]];
            if (column) {
                const hitZone = column.querySelector('.hit-zone');
                hitZone.classList.add('pressed');
                throttledHandleInput(column);
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.key in keyMap) {
            pressedKeys.delete(event.key);
            const columns = document.querySelectorAll('.column');
            const column = columns[keyMap[event.key]];
            if (column) {
                const hitZone = column.querySelector('.hit-zone');
                hitZone.classList.remove('pressed');
            }
        }
    });
}


function loseLife() {
    lives--;
    const lifeElement = document.getElementById(`life-${lives + 1}`);
    if (lifeElement) {
        lifeElement.classList.add('burn-life');
        setTimeout(() => {
            lifeElement.style.display = 'none';
        }, 500);
    }

    if (lives <= 0) {
        endGame(false); 
    }
}

function endGame(completed = false) {
    if (audio) {
        audio.pause();
    }
    clearInterval(interval);

    const currentSongId = sessionStorage.getItem('currentSongId');
    const gameData = {
        score: currentScore,
        maxCombo: maxCombo,
        duration: audio.currentTime,
        completed: completed,
        difficulty: getDifficultyFromContent(sessionStorage.getItem('osuContent')),
        songId: currentSongId,
        date: new Date().toISOString()
    };

    localStorage.setItem('lastScore', JSON.stringify(gameData));

   
    const scores = JSON.parse(localStorage.getItem('gameScores')) || [];
    scores.push(gameData);
    localStorage.setItem('gameScores', JSON.stringify(scores));
    
    if (completed && gameData.difficulty === 'HARD') {
        const songLegendStatus = JSON.parse(localStorage.getItem('songsLegendStatus')) || {};
        songLegendStatus[currentSongId] = true;
        localStorage.setItem('songsLegendStatus', JSON.stringify(songLegendStatus));
    }

    setTimeout(() => {
        window.location.replace(completed ? 'complete.html' : 'endgame.html');
    }, 300);
}



let consecutiveHits = 0; 
const maxHits = 5; 

const baseImage = document.getElementById('character-base');
const fireImage = document.getElementById('character-fire');


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


function updateComboDisplay() {
    let comboDisplay = document.getElementById('comboDisplay');
    
    if (!comboDisplay) {
        comboDisplay = document.createElement('div');
        comboDisplay.id = 'comboDisplay';
        comboDisplay.className = 'combo-display';
        document.body.appendChild(comboDisplay);
    }

    if (currentCombo > 1) {
        comboDisplay.innerHTML = `
            <img src="./assets/skins/combo.png" class="combo-text">
            <div class="combo-numbers">
                ${currentCombo.toString().split('').map(num => 
                    `<img src="./assets/skins/num${num}.png">`
                ).join('')}
            </div>
        `;
        comboDisplay.style.display = 'flex';
    } else {
        comboDisplay.style.display = 'none';
    }
}


if (isMobile) {
    const columns = document.querySelectorAll('.column');
    columns.forEach(column => {
        const hitZone = column.querySelector('.hit-zone');
        
        column.addEventListener('touchstart', () => {
            hitZone.classList.add('pressed');
        });

        column.addEventListener('touchend', () => {
            hitZone.classList.remove('pressed');
        });
    });
} else {
    const keyMap = {
        'd': 0,
        'f': 1,
        'j': 2,
        'k': 3
    };

    document.addEventListener('keydown', (event) => {
        if (event.key in keyMap) {
            const columns = document.querySelectorAll('.column');
            const column = columns[keyMap[event.key]];
            if (column) {
                const hitZone = column.querySelector('.hit-zone');
                hitZone.classList.add('pressed');
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.key in keyMap) {
            const columns = document.querySelectorAll('.column');
            const column = columns[keyMap[event.key]];
            if (column) {
                const hitZone = column.querySelector('.hit-zone');
                hitZone.classList.remove('pressed');
            }
        }
    });
}

function getDifficultyFromContent(osuContent) {
    if (!osuContent) return 'UNKNOWN';
    
    const ar = getApproachRate(osuContent);
    
    if (ar <= 4) return 'EASY';
    if (ar <= 5) return 'MEDIUM';
    if (ar <= 8) return 'HARD';
    return 'LEGEND';
}

function getApproachRate(osuContent) {
    const lines = osuContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('ApproachRate:')) {
            return parseFloat(line.split(':')[1]);
        }
    }
    return 0;
}