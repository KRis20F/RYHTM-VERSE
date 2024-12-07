fileInput?.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.osz')) {
        console.log('Cargando archivo .osz...');
        await loadOsz(file);
    } else {
        alert('Por favor, selecciona un archivo .osz válido.');
    }
});

async function loadOsz(file) {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);

    let osuFile = null;
    let audioFile = null;

    Object.keys(contents.files).forEach((filename) => {
        if (filename.endsWith('.osu')) osuFile = contents.files[filename];
        if (filename.endsWith('.mp3') || filename.endsWith('.ogg')) audioFile = contents.files[filename];
    });

    if (!osuFile || !audioFile) {
        alert('Archivo .osz inválido.');
        return;
    }

    const osuText = await osuFile.async('string');
    const audioBlob = await audioFile.async('blob');
    const audioBase64 = await convertBlobToBase64(audioBlob);

    localStorage.setItem('osuMap', osuText);
    localStorage.setItem('audioBlob', audioBase64);

    console.log('Mapa y audio cargados.');
}

function selectDifficulty(difficulty) {
    localStorage.setItem('selectedDifficulty', difficulty);
    window.location.href = 'game.html';
}

function convertBlobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
