window.addEventListener('load', () => {
    const defaultSongs = [
        { id: '347765', title: 'Racemization', artist: 'Camellia', oszFile: '347765 Camellia - Racemization.osz' },
        { id: '1007069', title: 'Killer Queen', artist: 'Queen', oszFile: '1007069 Queen - Killer Queen.osz' },
        { id: '59619',title: 'Paradise',artist: 'Coldplay',oszFile: '59619 Coldplay - Paradise.osz'},
        { id: '576030',title: 'Battle Against a True Hero',artist: 'toby fox vs. Ferdk',oszFile: '576030 toby fox vs. Ferdk - Battle Against a True Hero.osz'},
        { id: '100649', title:'Viva La Vida',artist: 'Coldplay',oszFile: '100649 Coldplay - Viva La Vida.osz'},
        { id: '700945', title: 'levan polkka', artist: 'Miku', oszFile: '700945 Otomania - Ievan Polkka.osz'},
        { id: '2068931', title: 'Dont Stop Me Now', artist: 'Queen', oszFile: '2068931 Queen - Don\'t Stop Me Now.osz'},
        { id: '601347', title: 'Take On Me', artist: 'A-HA', oszFile: '601347 a-ha - Take On Me.osz'},
        { id: '1750732', title: 'Metamorphosis', artist: 'INTERWORLD', oszFile: '1750732 INTERWORLD - METAMORPHOSIS.osz'}
    ];

    async function processOszFile(file) {
        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);

            let osuFiles = [];
            let audioFile = null;

            for (let filename in contents.files) {
                if (filename.endsWith('.osu')) {
                    const content = await contents.files[filename].async('string');
                    osuFiles.push({ filename, content });
                }
                if (filename.toLowerCase().endsWith('.mp3') || filename.toLowerCase().endsWith('.ogg')) {
                    audioFile = await contents.files[filename].async('blob');
                }
            }

            if (osuFiles.length === 0) throw new Error('No se encontraron archivos .osu');

            if (audioFile) {
                await saveToIndexedDB('audioFiles', 'currentAudio', audioFile);
            }

            const difficulties = osuFiles.map(osuFile => {
                const diffInfo = parseDifficultyInfo(osuFile.content);
                return { ...diffInfo, filename: osuFile.filename, content: osuFile.content };
            });

            displayDifficulties(difficulties);
        } catch (error) {
            console.error('Error al procesar el archivo:', error);
            alert('Error al procesar el archivo .osz');
        }
    }

    async function saveToIndexedDB(storeName, key, value) {
        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase('gameDB');
            
            deleteRequest.onsuccess = () => {
                const request = indexedDB.open('gameDB', 1);

                request.onerror = () => reject(request.error);

                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    db.createObjectStore(storeName);
                };

                request.onsuccess = () => {
                    const db = request.result;
                    try {
                        const tx = db.transaction(storeName, 'readwrite');
                        const store = tx.objectStore(storeName);
                        const putRequest = store.put(value, key);

                        putRequest.onsuccess = () => {
                            tx.oncomplete = () => {
                                db.close();
                                resolve();
                            };
                        };

                        putRequest.onerror = () => reject(putRequest.error);
                    } catch (error) {
                        reject(error);
                    }
                };
            };

            deleteRequest.onerror = () => reject(deleteRequest.error);
        });
    }

    function parseDifficultyInfo(osuContent) {
        const info = { version: 'Unknown Difficulty', approachRate: 0, circleSize: 0, hpDrain: 0 };
        const lines = osuContent.split('\n');
        for (const line of lines) {
            if (line.startsWith('Version:')) info.version = line.split(':')[1].trim();
            if (line.startsWith('ApproachRate:')) info.approachRate = parseFloat(line.split(':')[1]);
            if (line.startsWith('CircleSize:')) info.circleSize = parseFloat(line.split(':')[1]);
            if (line.startsWith('HPDrainRate:')) info.hpDrain = parseFloat(line.split(':')[1]);
        }
        return info;
    }

    function displayDifficulties(difficulties) {
        const difficultyContainer = document.getElementById('difficultyContainer');
        if (!difficultyContainer) return;

        const categories = { easy: [], medium: [], hard: [], legend: [] };
    
        difficulties.forEach(diff => {
            if (diff.approachRate <= 4) categories.easy.push(diff);
            else if (diff.approachRate <= 5) categories.medium.push(diff);
            else if (diff.approachRate <= 8) categories.hard.push(diff);
            else categories.legend.push(diff);
        });

        difficultyContainer.innerHTML = '<h2>Selecciona una dificultad</h2>';

        Object.entries(categories).forEach(([key, diffs]) => {
            if (diffs.length === 0) return; 

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            

            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)} (${diffs.length})`;
            categoryDiv.appendChild(categoryTitle);


            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'difficulty-buttons';


            diffs.forEach(diff => {
                const button = document.createElement('button');
                button.className = 'difficulty-button';
                
    
                let difficultyCategory = 'Easy';
                if (diff.approachRate > 8.5) difficultyCategory = 'Legend';
                else if (diff.approachRate > 6) difficultyCategory = 'Hard';
                else if (diff.approachRate > 4) difficultyCategory = 'Medium';
                
    
                diff.category = difficultyCategory;
                
                button.innerHTML = `
                    <h4>${diff.version}</h4>
                    <p>AR: ${diff.approachRate} | CS: ${diff.circleSize} | HP: ${diff.hpDrain}</p>
                `;

                button.addEventListener('click', () => {
                    selectDifficulty(diff.filename, diff);
                });

                buttonsDiv.appendChild(button);
            });

            categoryDiv.appendChild(buttonsDiv);
            difficultyContainer.appendChild(categoryDiv);
        });
    }

    function selectDifficulty(filename, diffData) {
        try {
            sessionStorage.setItem('difficultyCategory', diffData.category);
            sessionStorage.setItem('osuContent', diffData.content);
            window.location.href = 'game.html';
        } catch (error) {
            console.error('Error al procesar los datos:', error);
        }
    }

    async function loadDefaultSong(oszFile) {
        try {
            const response = await fetch(`./assets/songs/${oszFile}`);
            if (!response.ok) throw new Error(`No se pudo cargar el archivo: ${oszFile}`);
            const blob = await response.blob();
            await processOszFile(new File([blob], oszFile));
        } catch (error) {
            console.error('Error al cargar la canción:', error);
            alert(`Error al cargar la canción: ${oszFile}`);
        }
    }

    function loadSongList() {
        const songList = document.querySelector('.song-list');
        if (!songList) {
            console.error('No se encontró el elemento .song-list');
            return;
        }

        songList.innerHTML = '';
        defaultSongs.forEach(song => {
            const songCard = document.createElement('div');
            songCard.className = 'song-card';
            songCard.innerHTML = `<div class="song-info"><h3>${song.title}</h3><p>${song.artist}</p></div>`;
            songCard.addEventListener('click', () => loadDefaultSong(song.oszFile));
            songList.appendChild(songCard);
        });
    }

    loadSongList();
});



