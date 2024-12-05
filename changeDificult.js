document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.osz')) {
        console.log('Cargando archivo .osz...');
        await loadOsz(file);  // Cargar el archivo .osz
    } else {
        alert('Por favor selecciona un archivo .osz válido.');
    }
});

// Cargar y procesar el archivo .osz
async function loadOsz(file) {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file); // Descomprimir el archivo .osz

    let osuFile = null;
    let audioFile = null;

    // Buscar archivos .osu y el archivo de audio en el .osz
    Object.keys(contents.files).forEach((filename) => {
        if (filename.endsWith('.osu')) osuFile = contents.files[filename]; // Archivo del mapa
        if (filename.endsWith('.mp3') || filename.endsWith('.ogg')) audioFile = contents.files[filename]; // Archivo de audio
        console.log(audioFile);
    });

    if (!osuFile || !audioFile) {
        console.error('El archivo .osz no contiene mapa o audio válidos.');
        alert('No se encontró mapa o audio en el archivo .osz');
        return;
    }

    // Procesar el archivo .osu
    const osuText = await osuFile.async('string');
    console.log('Contenido del archivo .osu:', osuText); // Verificar en consola

    const difficulties = parseDifficulties(osuText); // Extraer todas las secciones de dificultad

    // Procesar el archivo de audio
    try {
        const audioBlob = await audioFile.async('blob'); // Crear el Blob de audio
        const audioUrl = URL.createObjectURL(audioBlob); // Crear una URL temporal

        // Almacenar la URL del audio y las dificultades en sessionStorage
        sessionStorage.setItem('audioUrl', audioUrl); // Almacenar la URL temporal del audio
        sessionStorage.setItem('osuContent', osuText); // Almacenar el contenido del mapa
        console.log('Mapa y audio cargados.');
    } catch (error) {
        console.error('Error al intentar cargar el archivo de audio:', error);
        alert('Error al intentar cargar el archivo de audio');
    }

    // Mostrar las dificultades
    displayDifficulties(difficulties);
}

// Extraer todas las secciones de dificultad del archivo .osu
function parseDifficulties(osuText) {
    const difficulties = [];
    const difficultyRegex = /\[Difficulty\](.*?)\[.*?\]/gs; // Hacer que la regex sea más robusta

    let match;
    
    // Buscar todas las secciones de dificultad en el archivo .osu
    while ((match = difficultyRegex.exec(osuText)) !== null) {
        const section = match[1].trim(); // Contenido de la sección [Difficulty]
        difficulties.push(section); // Añadir la sección completa
    }

    console.log("Dificultades extraídas:", difficulties); // Verificar en consola
    return difficulties;
}

// Mostrar las dificultades al usuario
function displayDifficulties(difficulties) {
    const difficultyContainer = document.getElementById('difficultyContainer');
    if (difficultyContainer) {
        difficultyContainer.innerHTML = ''; // Limpiar el contenedor

        difficulties.forEach((difficulty, index) => {
            const difficultyButton = document.createElement('button');
            difficultyButton.textContent = `Dificultad ${index + 1}: ${difficulty}`;
            difficultyButton.addEventListener('click', () => selectDifficulty(difficulty));
            difficultyContainer.appendChild(difficultyButton);
        });
    } else {
        console.error('No se encontró el contenedor de dificultades.');
    }
}

// Manejar la selección de una dificultad
function selectDifficulty(difficulty) {
    const audioUrl = sessionStorage.getItem('audioUrl');

    if (!audioUrl) {
        alert('No se cargó un archivo de audio. Volviendo a la página principal.');
        window.location.href = 'index.html';
        return;
    }

    sessionStorage.setItem('selectedDifficulty', difficulty); // Guardar la dificultad seleccionada
    console.log(`Dificultad seleccionada: ${difficulty}`);
    window.location.href = 'game.html'; // Redirigir a la página del juego
}
