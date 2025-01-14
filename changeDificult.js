window.addEventListener('load', () => {
    const defaultSongs = [
        { id: '347765', title: 'Racemization', artist: 'Camellia', oszFile: '347765 Camellia - Racemization.osz', legendUnlocked: false, img: 'Race.jpg'},
        { id: '1007069', title: 'Killer Queen', artist: 'Queen', oszFile: '1007069 Queen - Killer Queen.osz', legendUnlocked: false, img: 'Queen.webp'},
        { id: '59619',title: 'Paradise',artist: 'Coldplay',oszFile: '59619 Coldplay - Paradise.osz', legendUnlocked: false, img: 'bgCold.jpg'},
        { id: '576030',title: 'Battle Against a True Hero',artist: 'toby fox vs. Ferdk',oszFile: '576030 toby fox vs. Ferdk - Battle Against a True Hero.osz', legendUnlocked: false, img: 'bgUn.jpg'},
        { id: '100649', title:'Viva La Vida',artist: 'Coldplay',oszFile: '100649 Coldplay - Viva la Vida.osz', legendUnlocked: false, img: 'bgCold.jpg'},
        { id: '700945', title: 'levan polkka', artist: 'Miku', oszFile: '700945 Otomania - Ievan Polkka.osz', legendUnlocked: false, img: 'bgMiku.webp'},
        { id: '2068931', title: 'Dont Stop Me Now', artist: 'Queen', oszFile: '2068931 Queen - Don\'t Stop Me Now.osz', legendUnlocked: false, img: 'Queen.webp'},
        { id: '601347', title: 'Take On Me', artist: 'A-HA', oszFile: '601347 a-ha - Take On Me.osz', legendUnlocked: false, img: 'Take.jpg'},
        { id: '1750732', title: 'Metamorphosis', artist: 'INTERWORLD', oszFile: '1750732 INTERWORLD - METAMORPHOSIS.osz', legendUnlocked: true, img: 'Meta.png'},
        { id: '789869', title: 'liquated', artist: 'Camellia', oszFile: '789869 Camellia - liquated.osz', legendUnlocked: false, img: 'Liq.jpg'},
        { id: '895391', title: 'Sunflower', artist: 'Post Malone, Swae Lee', oszFile: '895391 Post Malone, Swae Lee - Sunflower.osz', legendUnlocked: false, img: 'Sun.jpg'}
    ];

    async function processOszFile(file, songId) {
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

            displayDifficulties(difficulties, songId);
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

    function displayDifficulties(difficulties, songId) {
        const difficultyContainer = document.getElementById('difficultyContainer');
        if (!difficultyContainer) return;
        
        const categories = { easy: [], medium: [], hard: [], legend: [] };
        const songLegendStatus = JSON.parse(localStorage.getItem('songsLegendStatus')) || {};
        
        const isLegendUnlocked = songId === '1750732' ? true : songLegendStatus[songId] === true;
        
        difficulties.forEach(diff => {
            if (diff.approachRate <= 4) categories.easy.push(diff);
            else if (diff.approachRate <= 5) categories.medium.push(diff);
            else if (diff.approachRate <= 8) categories.hard.push(diff);
            else categories.legend.push(diff);
        });

        difficultyContainer.innerHTML = '';

        Object.entries(categories).forEach(([key, diffs]) => {
            if (diffs.length === 0) return;

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';

            const categoryTitle = document.createElement('h3');
            categoryTitle.className = `category-title ${key}-title`;
            categoryTitle.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)} (${diffs.length})`;
            
            if (key === 'legend' && !isLegendUnlocked) {
                categoryTitle.innerHTML += ' 🔒';
                categoryTitle.classList.add('locked');
            }
            
            categoryDiv.appendChild(categoryTitle);

            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'difficulty-buttons';

            diffs.forEach(diff => {
                const button = document.createElement('button');
                button.className = 'difficulty-button';
                
                if (key === 'legend' && !isLegendUnlocked) {
                    button.classList.add('locked');
                    button.disabled = true;
                    button.title = 'Completa esta canción en dificultad HARD para desbloquear LEGEND';
                }

                button.innerHTML = `
                    <div class="diff-info">
                        <h4>${diff.version}</h4>
                        <div class="diff-stats">
                            <span>AR: ${diff.approachRate}</span>
                            <span>CS: ${diff.circleSize}</span>
                            <span>HP: ${diff.hpDrain}</span>
                        </div>
                    </div>
                `;

                button.addEventListener('click', () => {
                    if (!button.classList.contains('locked')) {
                        selectDifficulty(diff.filename, diff, songId);
                    }
                });

                buttonsDiv.appendChild(button);
            });

            categoryDiv.appendChild(buttonsDiv);
            difficultyContainer.appendChild(categoryDiv);
        });
    }

    function selectDifficulty(filename, diffData, songId) {
        try {
            sessionStorage.setItem('currentSongId', songId);
            sessionStorage.setItem('difficultyCategory', diffData.category);
            sessionStorage.setItem('osuContent', diffData.content);
            window.location.href = 'game.html';
        } catch (error) {
            console.error('Error al procesar los datos:', error);
        }
    }

    async function loadDefaultSong(song) {
        try {
            const response = await fetch(`./assets/songs/${song.oszFile}`);
            if (!response.ok) throw new Error(`No se pudo cargar el archivo: ${song.oszFile}`);
            const blob = await response.blob();
            await processOszFile(new File([blob], song.oszFile), song.id);
        } catch (error) {
            console.error('Error al cargar la canción:', error);
            const difficultyContainer = document.getElementById('difficultyContainer');
            if (difficultyContainer) {
                difficultyContainer.innerHTML = `
                    <div class="category error">
                        <div class="difficulty-button">
                            <div class="diff-info">
                                <h4>Error al cargar las dificultades</h4>
                                <p class="diff-stats">Intenta de nuevo</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    function loadSongList() {
        const songList = document.querySelector('.song-list');
        if (!songList) return;

        let currentSongIndex = 0;

        function updateSongDisplay() {
            const song = defaultSongs[currentSongIndex];
            songList.innerHTML = `
                <div class="song-card active" style="background-image: url('./assets/img/${song.img}'); background-size: cover; background-position: center;">
                    <div class="song-info">
                        <h3>${song.title}</h3>
                        <p>${song.artist}</p>
                    </div>
                </div>
            `;
            
            
            const difficultyContainer = document.getElementById('difficultyContainer');
            if (difficultyContainer) {
                difficultyContainer.innerHTML = `
                    <div class="category">
                        <div class="difficulty-button">
                            <div class="diff-info">
                                <h4>Cargando dificultades...</h4>
                            </div>
                        </div>
                    </div>
                `;
            }


            loadDefaultSong(song);
        }

      
        const prevButton = document.querySelector('.prev-song');
        const nextButton = document.querySelector('.next-song');

        prevButton.addEventListener('click', () => {
            currentSongIndex = (currentSongIndex - 1 + defaultSongs.length) % defaultSongs.length;
            updateSongDisplay();
        });

        nextButton.addEventListener('click', () => {
            currentSongIndex = (currentSongIndex + 1) % defaultSongs.length;
            updateSongDisplay();
        });

        
        updateSongDisplay();
    }

    loadSongList();
});

