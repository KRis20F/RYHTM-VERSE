document.addEventListener('DOMContentLoaded', () => {
    try {
        // Reproducir audio de game over
        const audio = new Audio('./assets/music/BRUH MEME SONG - REMIX.m4a');
        audio.volume = 0.5;
        audio.play().catch(error => console.error('Error al reproducir el audio:', error));

        // Recuperar último puntaje
        const lastGame = JSON.parse(localStorage.getItem('lastScore'));
        if (lastGame) {
            showScorePopup(lastGame.score, lastGame.duration);
            showHighScores();
        }
        
    } catch (error) {
        console.error('Error general:', error);
    }
});

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
    
    document.querySelector('.tutorial-content').appendChild(highScoresDiv);
}

function showScorePopup(score, duration) {
    const popup = document.getElementById('tutorial-popup');
    const finalScoreElem = document.getElementById('final-score');
    const finalDurationElem = document.getElementById('final-duration');
    const classificationElem = document.getElementById('score-classification');

    finalScoreElem.textContent = score;
    finalDurationElem.textContent = duration.toFixed(2);

    let classification;
    if (score >= 1000) {
        classification = "Master";
    } else if (score >= 500) {
        classification = "Pro";
    } else if (score >= 100) {
        classification = "Amateur";
    } else {
        classification = "Beginner";
    }
    classificationElem.textContent = classification;

    popup.classList.remove('hidden');
}
