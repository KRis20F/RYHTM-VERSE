function checkUnlockLegend(gameData) {
    if (gameData.difficulty === 'HARD' && gameData.completed && gameData.score >= 500) { 
        localStorage.setItem('legendUnlocked', 'true');
        const unlockMessage = document.getElementById('unlock-message');
        if (unlockMessage) {
            unlockMessage.classList.remove('hidden');
        }
    }
} 