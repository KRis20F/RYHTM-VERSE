document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Cargando audio de endgame...');
        const audio = new Audio('./assets/music/BRUH MEME SONG - REMIX.m4a'); // Reemplaza con la ruta real del archivo de audio
        audio.volume = 0.5; // Ajusta el volumen (opcional)
        audio.play()
            .then(() => {
                console.log('Audio de fin del juego reproduciéndose correctamente.');
            })
            .catch(error => {
                console.error('Error al reproducir el audio:', error);
                alert('No se pudo reproducir el audio.');
            });
    } catch (error) {
        console.error('Error general en la reproducción del audio:', error);
    }
});


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

    
    const closeBtn = document.querySelector('.close-score');
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        popup.classList.add('hidden');
        
        window.location.href = 'index.html'; 
    });
}


function endGame() {
    console.log('Función endGame invocada');

    if (audio) {
        console.log('Audio pausado');
        audio.pause();
    }

    clearInterval(interval);

    const duration = audio.currentTime; 
    showScorePopup(currentScore, duration);
}
