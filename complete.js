document.addEventListener('DOMContentLoaded', () => {

    try {

        const audio = new Audio('./assets/music/Empire.m4a');
        audio.volume = 0.5;
        audio.play().catch(error => console.error('Error al reproducir el audio:', error));
    
        const gameData = JSON.parse(localStorage.getItem('lastScore'));
        
        if (gameData) {
            
            checkUnlockLegend(gameData);

        
            const finalScore = document.getElementById('final-score');
            const maxComboElem = document.getElementById('max-combo');
            const accuracyElem = document.getElementById('accuracy');
            const classificationElem = document.getElementById('score-classification');

            if (finalScore) finalScore.textContent = gameData.score;
            if (maxComboElem) maxComboElem.textContent = gameData.maxCombo;
            if (accuracyElem) accuracyElem.textContent = calculateAccuracy(gameData.score).toFixed(2);
            
            
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

        
            showHighScores();
        }
    } catch (error) {
        console.error('Error general:', error);
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
    
    const maxPossibleScore = 1500; 

    const validScore = Math.min(score, maxPossibleScore);

    return (validScore / maxPossibleScore) * 100;
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
        
        const existingHighScores = tutorialContent.querySelector('.high-scores');
        if (existingHighScores) {
            existingHighScores.remove();
        }
        tutorialContent.appendChild(highScoresDiv);
    }
}









