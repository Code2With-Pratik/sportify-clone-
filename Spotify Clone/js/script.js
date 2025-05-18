// Wait for the DOM to load before running the main logic
document.addEventListener("DOMContentLoaded", () => {
    console.log('Lets write JavaScript');

    let currentSong = new Audio();
    let songs = [];
    let currFolder;
    let currentIndex = 0; // Track current song index

    // Declare DOM elements at the top so they're available in `main()`
    const play = document.getElementById("play");
    const previous = document.getElementById("previous");
    const next = document.getElementById("next");

    function secondsToMinutesSeconds(seconds) {
        if (isNaN(seconds) || seconds < 0) {
            return "00:00";
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    async function getSongs(folder) {
        currFolder = folder;
        let a = await fetch(`/${folder}/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${folder}/`)[1]);
            }
        }

        // Show all the songs in the playlist
        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";
        for (const song of songs) {
            songUL.innerHTML += `
                <li>
                    <img class="invert" width="34" src="img/music.svg" alt="">
                    <div class="info">
                        <div>${song.replaceAll("%20", " ")}</div>
                        <div>Harry</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="img/play.svg" alt="">
                    </div>
                </li>`;
        }

        // Add click listeners to each song item
        Array.from(document.querySelectorAll(".songList li")).forEach((e, i) => {
            e.addEventListener("click", () => {
                currentIndex = i;  // update currentIndex when user selects a song
                const track = e.querySelector(".info").firstElementChild.innerHTML.trim();
                playMusic(songs[currentIndex]);
            });
        });

        return songs;
    }

    const playMusic = (track, pause = false) => {
        currentSong.src = `/${currFolder}/` + track;
        currentIndex = songs.indexOf(track);  // update current index
        if (!pause) {
            currentSong.play();
            play.src = "img/pause.svg";
        }
        document.querySelector(".songinfo").innerHTML = decodeURI(track);
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    }

    async function displayAlbums() {
        console.log("displaying albums");
        let a = await fetch(`/songs/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        let array = Array.from(anchors);
        for (let index = 0; index < array.length; index++) {
            const e = array[index];
            if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
                let folder = e.href.split("/").slice(-2)[0];
                try {
                    let a = await fetch(`/songs/${folder}/info.json`);
                    let metadata = await a.json();
                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <img src="/songs/${folder}/cover.jpg" alt="">
                            <h2>${metadata.title}</h2>
                            <p>${metadata.description}</p>
                        </div>`;
                } catch (err) {
                    console.error(`Error loading album info for folder ${folder}`, err);
                }
            }
        }

        // Add click listeners to cards
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                console.log("Fetching Songs");
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                currentIndex = 0;
                playMusic(songs[0]);
            });
        });
    }

    async function main() {
        await getSongs("songs/ncs");
        currentIndex = 0;
        playMusic(songs[0], true);

        await displayAlbums();

        play.addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play();
                play.src = "img/pause.svg";
            } else {
                currentSong.pause();
                play.src = "img/play.svg";
            }
        });

        currentSong.addEventListener("timeupdate", () => {
            document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
            if (currentSong.duration) {
                document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
            }
        });

        // Auto play next song when current ends
        currentSong.addEventListener("ended", () => {
            if (currentIndex < songs.length - 1) {
                currentIndex++;
                playMusic(songs[currentIndex]);
            } else {
                // Optionally: loop to first song or stop
                currentIndex = 0;
                playMusic(songs[currentIndex], true); // pause on first song
                play.src = "img/play.svg";
            }
        });

        document.querySelector(".seekbar").addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentSong.currentTime = (currentSong.duration * percent) / 100;
        });

        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });

        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });

        previous.addEventListener("click", () => {
            if (currentIndex > 0) {
                currentIndex--;
                playMusic(songs[currentIndex]);
            }
        });

        next.addEventListener("click", () => {
            if (currentIndex < songs.length - 1) {
                currentIndex++;
                playMusic(songs[currentIndex]);
            }
        });

        document.querySelector(".range input").addEventListener("change", e => {
            currentSong.volume = parseInt(e.target.value) / 100;
            if (currentSong.volume > 0) {
                document.querySelector(".volume>img").src = "img/volume.svg";
            }
        });

        document.querySelector(".volume>img").addEventListener("click", e => {
            if (e.target.src.includes("volume.svg")) {
                e.target.src = e.target.src.replace("volume.svg", "mute.svg");
                currentSong.volume = 0;
                document.querySelector(".range input").value = 0;
            } else {
                e.target.src = e.target.src.replace("mute.svg", "volume.svg");
                currentSong.volume = 0.1;
                document.querySelector(".range input").value = 10;
            }
        });
    }

    main();
});
