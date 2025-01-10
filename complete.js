document.addEventListener('DOMContentLoaded', () => {
    // Obtener los datos del último juego
    const gameData = JSON.parse(localStorage.getItem('lastScore'));
    
    if (gameData) {
        // Mostrar el mensaje de desbloqueo de LEGEND si corresponde
        checkUnlockLegend(gameData);
        
        // Mostrar el popup con los puntajes
        const finalScore = document.getElementById('final-score');
        const maxComboElem = document.getElementById('max-combo');
        const accuracyElem = document.getElementById('accuracy');
        const classificationElem = document.getElementById('score-classification');

        if (finalScore) finalScore.textContent = gameData.score;
        if (maxComboElem) maxComboElem.textContent = gameData.maxCombo;
        if (accuracyElem) accuracyElem.textContent = calculateAccuracy(gameData.score).toFixed(2);
        
        // Determinar clasificación
        let classification;
        if (gameData.score >= 60000) {
            classification = "Master";
            document.getElementById('Messege').textContent = "Master";
        } else if (gameData.score >= 40000) {
            classification = "Pro";
            document.getElementById('Messege').textContent = "Pro";
        } else if (gameData.score >= 20000) {
            classification = "Amateur";
            document.getElementById('Messege').textContent = "Amateur";
        } else if (gameData.score >= 10000) {
            classification = "Beginner";
            document.getElementById('Messege').textContent = "Beginner";
        } else {
            classification = "Noob";
            document.getElementById('Messege').textContent = "Noob";

        }
        if (classificationElem) classificationElem.textContent = classification;

        // Mostrar high scores
        showHighScores();
    }
});

function checkUnlockLegend(gameData) {
    if (gameData.difficulty === 'HARD' && gameData.completed && gameData.score >= 500) { 
        localStorage.setItem('legendUnlocked', 'true');
        const unlockMessage = document.getElementById('unlock-message');
        if (unlockMessage) {
            unlockMessage.classList.remove('hidden');
        }
    }
} 

function calculateAccuracy(score) {
    // Ejemplo simple de cálculo de precisión basado en el puntaje
    const maxPossibleScore = 1500; // Ajusta este valor según tu lógica de juego
    return (score / maxPossibleScore) * 100;
}

function showHighScores() {
    const scores = JSON.parse(localStorage.getItem('gameScores')) || [];
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 5);
    
    const highScoresDiv = document.createElement('div');
    highScoresDiv.className = 'high-scores';
    highScoresDiv.innerHTML = `
        <h3>Mejores Puntajes</h3>
        <ul>
            ${topScores.map(score => `
                <li>
                    ${score.score} puntos 
                    - Combo: ${score.maxCombo}
                    - ${new Date(score.date).toLocaleDateString()}
                </li>
            `).join('')}
        </ul>
    `;
    
    const tutorialContent = document.querySelector('.tutorial-content');
    if (tutorialContent) {
        // Eliminar high scores anteriores si existen
        const existingHighScores = tutorialContent.querySelector('.high-scores');
        if (existingHighScores) {
            existingHighScores.remove();
        }
        tutorialContent.appendChild(highScoresDiv);
    }
}









