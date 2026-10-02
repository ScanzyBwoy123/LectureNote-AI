// ==========================================
// LectureNote AI
// Main Application JavaScript
// ==========================================


// ==========================================
// GET ELEMENTS
// ==========================================

const newLessonBtn =
    document.getElementById("newLessonBtn");

const startLessonBtn =
    document.getElementById("startLessonBtn");

const emptyStartBtn =
    document.getElementById("emptyStartBtn");

const lessonModal =
    document.getElementById("lessonModal");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const lessonForm =
    document.getElementById("lessonForm");

const lessonList =
    document.getElementById("lessonList");

const emptyState =
    document.getElementById("emptyState");

const lessonCount =
    document.getElementById("lessonCount");

const notesCount =
    document.getElementById("notesCount");

const studyTime =
    document.getElementById("studyTime");


// ==========================================
// RECORDING ELEMENTS
// ==========================================

const recordingPanel =
    document.getElementById("recordingPanel");

const recordingDot =
    document.getElementById("recordingDot");

const recordingStatusText =
    document.getElementById("recordingStatusText");

const recordingTimerElement =
    document.getElementById("recordingTimer");

const stopRecordingBtn =
    document.getElementById("stopRecordingBtn");


// ==========================================
// LESSON STORAGE
// ==========================================

const STORAGE_KEY =
    "lectureNoteAI_lessons";


// ==========================================
// AUDIO DATABASE
// ==========================================

const AUDIO_DB_NAME =
    "LectureNoteAI_AudioDB";

const AUDIO_STORE_NAME =
    "recordings";


// ==========================================
// RECORDING VARIABLES
// ==========================================

let microphoneStream = null;

let mediaRecorder = null;

let audioChunks = [];

let currentLesson = null;

let recordingStartTime = null;

let recordingTimer = null;


// ==========================================
// OPEN LESSON MODAL
// ==========================================

function openLessonModal() {

    if (!lessonModal) {
        return;
    }

    lessonModal.classList.remove(
        "hidden"
    );

}


// ==========================================
// CLOSE LESSON MODAL
// ==========================================

function closeLessonModal() {

    if (!lessonModal) {
        return;
    }

    lessonModal.classList.add(
        "hidden"
    );

}


// ==========================================
// BUTTON EVENTS
// ==========================================

if (newLessonBtn) {

    newLessonBtn.addEventListener(
        "click",
        openLessonModal
    );

}


if (startLessonBtn) {

    startLessonBtn.addEventListener(
        "click",
        openLessonModal
    );

}


if (emptyStartBtn) {

    emptyStartBtn.addEventListener(
        "click",
        openLessonModal
    );

}


if (closeModalBtn) {

    closeModalBtn.addEventListener(
        "click",
        closeLessonModal
    );

}


// ==========================================
// CLOSE MODAL OUTSIDE CLICK
// ==========================================

if (lessonModal) {

    lessonModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                lessonModal
            ) {

                closeLessonModal();

            }

        }
    );

}


// ==========================================
// LESSON STORAGE FUNCTIONS
// ==========================================

function getLessons() {

    const savedLessons =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!savedLessons) {

        return [];

    }


    try {

        return JSON.parse(
            savedLessons
        );

    } catch (error) {

        console.error(
            "Could not load lessons:",
            error
        );

        return [];

    }

}


function saveLessons(
    lessons
) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(lessons)
    );

}


// ==========================================
// OPEN AUDIO DATABASE
// ==========================================

function openAudioDatabase() {

    return new Promise(
        function (resolve, reject) {

            const request =
                indexedDB.open(
                    AUDIO_DB_NAME,
                    1
                );


            request.onupgradeneeded =
                function (event) {

                    const db =
                        event.target.result;


                    if (
                        !db.objectStoreNames.contains(
                            AUDIO_STORE_NAME
                        )
                    ) {

                        db.createObjectStore(
                            AUDIO_STORE_NAME,
                            {
                                keyPath:
                                    "lessonId"
                            }
                        );

                    }

                };


            request.onsuccess =
                function () {

                    resolve(
                        request.result
                    );

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ==========================================
// SAVE AUDIO PERMANENTLY
// ==========================================

function saveAudioToDatabase(
    lessonId,
    audioBlob,
    durationSeconds
) {

    return openAudioDatabase()
        .then(
            function (db) {

                return new Promise(
                    function (
                        resolve,
                        reject
                    ) {

                        const transaction =
                            db.transaction(
                                AUDIO_STORE_NAME,
                                "readwrite"
                            );


                        const store =
                            transaction.objectStore(
                                AUDIO_STORE_NAME
                            );


                        store.put({

                            lessonId:
                                lessonId,

                            audio:
                                audioBlob,

                            durationSeconds:
                                durationSeconds,

                            savedAt:
                                new Date()
                                    .toISOString()

                        });


                        transaction.oncomplete =
                            function () {

                                db.close();

                                resolve();

                            };


                        transaction.onerror =
                            function () {

                                db.close();

                                reject(
                                    transaction.error
                                );

                            };

                    }
                );

            }
        );

}


// ==========================================
// CHECK WHETHER RECORDING EXISTS
// ==========================================

function recordingExists(
    lessonId
) {

    return openAudioDatabase()
        .then(
            function (db) {

                return new Promise(
                    function (
                        resolve,
                        reject
                    ) {

                        const transaction =
                            db.transaction(
                                AUDIO_STORE_NAME,
                                "readonly"
                            );


                        const store =
                            transaction.objectStore(
                                AUDIO_STORE_NAME
                            );


                        const request =
                            store.get(
                                lessonId
                            );


                        request.onsuccess =
                            function () {

                                db.close();

                                resolve(
                                    Boolean(
                                        request.result
                                    )
                                );

                            };


                        request.onerror =
                            function () {

                                db.close();

                                reject(
                                    request.error
                                );

                            };

                    }
                );

            }
        );

}


// ==========================================
// CREATE NEW LESSON
// ==========================================

if (lessonForm) {

    lessonForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const subject =
                document
                    .getElementById(
                        "subject"
                    )
                    ?.value
                    .trim();


            const topic =
                document
                    .getElementById(
                        "topic"
                    )
                    ?.value
                    .trim();


            const teacher =
                document
                    .getElementById(
                        "teacher"
                    )
                    ?.value
                    .trim();


            if (!subject || !topic) {

                alert(
                    "Please enter the subject and topic."
                );

                return;

            }


            const lessons =
                getLessons();


            const newLesson = {

                id:
                    Date.now(),

                subject:
                    subject,

                topic:
                    topic,

                teacher:
                    teacher ||
                    "Not specified",

                date:
                    new Date()
                        .toLocaleDateString(
                            undefined,
                            {
                                year:
                                    "numeric",

                                month:
                                    "short",

                                day:
                                    "numeric"
                            }
                        ),

                duration:
                    0,

                notes:
                    "",

                transcript:
                    "",

                audioSaved:
                    false

            };


            lessons.unshift(
                newLesson
            );


            saveLessons(
                lessons
            );


            lessonForm.reset();


            closeLessonModal();


            renderLessons();


            await startMicrophone(
                newLesson
            );

        }
    );

}


// ==========================================
// START MICROPHONE
// ==========================================

async function startMicrophone(
    lesson
) {

    currentLesson =
        lesson;


    audioChunks =
        [];


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        alert(
            "Your browser does not support microphone access."
        );

        return;

    }


    try {

        microphoneStream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    audio: {

                        noiseSuppression:
                            true,

                        echoCancellation:
                            true,

                        autoGainControl:
                            true,

                        channelCount:
                            1

                    }

                });


        console.log(
            "Microphone permission granted."
        );


        console.log(
            "Noise suppression:",
            getTrackSetting(
                "noiseSuppression"
            )
        );


        console.log(
            "Echo cancellation:",
            getTrackSetting(
                "echoCancellation"
            )
        );


        console.log(
            "Automatic gain control:",
            getTrackSetting(
                "autoGainControl"
            )
        );


        startRecording();

    } catch (error) {

        console.error(
            "Microphone error:",
            error
        );


        alert(
            "Microphone access was not allowed. " +
            "Please allow microphone access and try again."
        );

    }

}


// ==========================================
// GET MICROPHONE SETTING
// ==========================================

function getTrackSetting(
    settingName
) {

    if (!microphoneStream) {

        return "Unavailable";

    }


    const tracks =
        microphoneStream
            .getAudioTracks();


    if (!tracks.length) {

        return "Unavailable";

    }


    const settings =
        tracks[0].getSettings();


    return (
        settings[settingName] ??
        "Not reported"
    );

}


// ==========================================
// MOVE RECORDING PANEL TO DASHBOARD
// ==========================================

function moveRecordingPanelToDashboard() {

    if (!recordingPanel) {

        return;

    }


    const main =
        document.querySelector(
            "main"
        );


    if (!main) {

        return;

    }


    if (
        recordingPanel.parentElement !==
        main
    ) {

        main.appendChild(
            recordingPanel
        );

    }

}


// ==========================================
// SHOW RECORDING PANEL
// ==========================================

function showRecordingPanel() {

    if (!recordingPanel) {

        return;

    }


    moveRecordingPanelToDashboard();


    recordingPanel.classList.remove(
        "hidden"
    );


    if (recordingStatusText) {

        recordingStatusText.textContent =
            "Recording lesson...";

    }


    if (recordingDot) {

        recordingDot.style.display =
            "inline-block";

    }


    if (recordingTimerElement) {

        recordingTimerElement.textContent =
            "00:00";

    }


    if (stopRecordingBtn) {

        stopRecordingBtn.disabled =
            false;

    }

}


// ==========================================
// HIDE RECORDING PANEL
// ==========================================

function hideRecordingPanel() {

    if (!recordingPanel) {

        return;

    }


    recordingPanel.classList.add(
        "hidden"
    );

}


// ==========================================
// START RECORDING
// ==========================================

function startRecording() {

    if (!microphoneStream) {

        return;

    }


    audioChunks =
        [];


    try {

        mediaRecorder =
            new MediaRecorder(
                microphoneStream
            );

    } catch (error) {

        console.error(
            "MediaRecorder error:",
            error
        );


        alert(
            "This browser cannot record audio."
        );


        return;

    }


    mediaRecorder.addEventListener(
        "dataavailable",
        function (event) {

            if (
                event.data &&
                event.data.size > 0
            ) {

                audioChunks.push(
                    event.data
                );

            }

        }
    );


    mediaRecorder.addEventListener(
        "stop",
        function () {

            saveRecording();

        }
    );


    mediaRecorder.start();


    recordingStartTime =
        Date.now();


    showRecordingPanel();


    updateRecordingTime();


    recordingTimer =
        setInterval(
            updateRecordingTime,
            1000
        );


    console.log(
        "Recording started."
    );

}


// ==========================================
// RECORDING TIMER
// ==========================================

function updateRecordingTime() {

    if (!recordingStartTime) {

        return;

    }


    const elapsed =
        Date.now() -
        recordingStartTime;


    const seconds =
        Math.floor(
            elapsed / 1000
        );


    if (recordingTimerElement) {

        recordingTimerElement.textContent =
            formatTime(
                seconds
            );

    }

}


// ==========================================
// FORMAT TIME
// ==========================================

function formatTime(
    seconds
) {

    const hours =
        Math.floor(
            seconds / 3600
        );


    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );


    const remainingSeconds =
        seconds % 60;


    return [

        String(hours)
            .padStart(
                2,
                "0"
            ),

        String(minutes)
            .padStart(
                2,
                "0"
            ),

        String(
            remainingSeconds
        ).padStart(
            2,
            "0"
        )

    ].join(":");

}


// ==========================================
// STOP RECORDING
// ==========================================

function stopRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state !==
        "inactive"
    ) {

        mediaRecorder.stop();

    }


    if (recordingTimer) {

        clearInterval(
            recordingTimer
        );

        recordingTimer =
            null;

    }


    if (microphoneStream) {

        microphoneStream
            .getTracks()
            .forEach(
                function (track) {

                    track.stop();

                }
            );


        microphoneStream =
            null;

    }


    if (recordingStatusText) {

        recordingStatusText.textContent =
            "Saving recording...";

    }


    if (recordingDot) {

        recordingDot.style.display =
            "none";

    }


    if (stopRecordingBtn) {

        stopRecordingBtn.disabled =
            true;

    }


    console.log(
        "Recording stopped."
    );

}


// ==========================================
// STOP BUTTON
// ==========================================

if (stopRecordingBtn) {

    stopRecordingBtn.addEventListener(
        "click",
        stopRecording
    );

}


// ==========================================
// SAVE RECORDING
// ==========================================

async function saveRecording() {

    if (!audioChunks.length) {

        hideRecordingPanel();

        return;

    }


    const audioBlob =
        new Blob(
            audioChunks,
            {
                type:
                    "audio/webm"
            }
        );


    const durationSeconds =
        recordingStartTime
            ? Math.floor(
                (
                    Date.now() -
                    recordingStartTime
                ) / 1000
            )
            : 0;


    console.log(
        "Audio captured:",
        audioBlob.size,
        "bytes"
    );


    if (!currentLesson) {

        return;

    }


    try {

        // ==================================
        // SAVE ACTUAL AUDIO
        // ==================================

        await saveAudioToDatabase(
            currentLesson.id,
            audioBlob,
            durationSeconds
        );


        // ==================================
        // UPDATE LESSON
        // ==================================

        const lessons =
            getLessons();


        const index =
            lessons.findIndex(
                function (lesson) {

                    return (
                        lesson.id ===
                        currentLesson.id
                    );

                }
            );


        if (index !== -1) {

            lessons[index].duration =
                Math.max(
                    Math.floor(
                        durationSeconds /
                        60
                    ),
                    1
                );


            lessons[index].audioSaved =
                true;


            lessons[index].audioType =
                "audio/webm";


            lessons[index].audioSize =
                audioBlob.size;


            lessons[index].audioSavedAt =
                new Date()
                    .toISOString();


            saveLessons(
                lessons
            );

        }


        if (recordingStatusText) {

            recordingStatusText.textContent =
                "✓ Recording saved on this device";

        }


        console.log(
            "Recording permanently saved."
        );


        renderLessons();


    } catch (error) {

        console.error(
            "Could not save recording:",
            error
        );


        if (recordingStatusText) {

            recordingStatusText.textContent =
                "Recording could not be saved";

        }


        alert(
            "The recording was captured, " +
            "but it could not be saved."
        );

    }


    audioChunks =
        [];


    currentLesson =
        null;


    recordingStartTime =
        null;


    setTimeout(
        function () {

            hideRecordingPanel();

        },
        2000
    );

}


// ==========================================
// PLAY SAVED RECORDING
// ==========================================
async function playSavedRecording(lessonId) {

    try {

        const db = await openAudioDatabase();

        const recording = await new Promise(
            function (resolve, reject) {

                const transaction =
                    db.transaction(
                        AUDIO_STORE_NAME,
                        "readonly"
                    );

                const store =
                    transaction.objectStore(
                        AUDIO_STORE_NAME
                    );

                const request =
                    store.get(lessonId);

                request.onsuccess =
                    function () {

                        resolve(
                            request.result
                        );

                    };

                request.onerror =
                    function () {

                        reject(
                            request.error
                        );

                    };

                transaction.oncomplete =
                    function () {

                        db.close();

                    };

            }
        );


        if (!recording) {

            alert(
                "No saved recording was found."
            );

            return;

        }


        if (!recording.audio) {

            alert(
                "The recording exists, but the audio file is missing."
            );

            return;

        }


        console.log(
            "Saved recording found:",
            recording
        );


        const audioBlob =
            recording.audio;


        console.log(
            "Audio type:",
            audioBlob.type
        );


        console.log(
            "Audio size:",
            audioBlob.size
        );


        if (audioBlob.size === 0) {

            alert(
                "The saved audio file is empty."
            );

            return;

        }


        // Create a playable URL
        const audioUrl =
            URL.createObjectURL(
                audioBlob
            );


        console.log(
            "Audio URL created:",
            audioUrl
        );


        // Create audio player
        const audio =
            new Audio();


        audio.preload =
            "auto";


        audio.src =
            audioUrl;


        audio.onloadedmetadata =
            function () {

                console.log(
                    "Audio duration:",
                    audio.duration
                );

            };


        audio.oncanplay =
            function () {

            console.log(
                "Audio can play."
            );

        };


        audio.onerror =
            function () {

                console.error(
                    "Audio playback error:",
                    audio.error
                );


                alert(
                    "The recording was saved, but your browser could not play this audio format."
                );


                URL.revokeObjectURL(
                    audioUrl
                );

            };


        audio.onended =
            function () {

                URL.revokeObjectURL(
                    audioUrl
                );

            };


        // iPhone/Safari requires play()
        // to happen from the user's interaction
        await audio.play();


        console.log(
            "Recording playback started."
        );

    } catch (error) {

        console.error(
            "Could not play recording:",
            error
        );


        alert(
            "The recording could not be played. Please try again."
        );

    }

}

// ==========================================
// DISPLAY LESSONS
// ==========================================

function renderLessons() {

    if (!lessonList || !emptyState) {
        return;
    }


    const lessons = getLessons();


    // ==========================================
    // UPDATE DASHBOARD NUMBERS
    // ==========================================

    if (lessonCount) {

        lessonCount.textContent =
            lessons.length;

    }


    if (notesCount) {

        notesCount.textContent =
            lessons.filter(
                function (lesson) {

                    return (
                        lesson.notes &&
                        lesson.notes.trim()
                    );

                }
            ).length;

    }


    const totalMinutes =
        lessons.reduce(
            function (total, lesson) {

                return (
                    total +
                    Number(
                        lesson.duration || 0
                    )
                );

            },
            0
        );


    if (studyTime) {

        studyTime.textContent =
            `${totalMinutes} min`;

    }


    // ==========================================
    // REMOVE OLD LESSON CARDS
    // ==========================================

    const existingCards =
        lessonList.querySelectorAll(
            ".lesson-card"
        );


    existingCards.forEach(
        function (card) {

            card.remove();

        }
    );


    // ==========================================
    // NO LESSONS
    // ==========================================

    if (lessons.length === 0) {

        emptyState.style.display =
            "block";

        return;

    }


    emptyState.style.display =
        "none";


    // ==========================================
    // CREATE LESSON CARDS
    // ==========================================

    lessons.forEach(
        function (lesson) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "lesson-card";


            // ==================================
            // LESSON INFORMATION
            // ==================================

            const content =
                document.createElement(
                    "div"
                );


            content.innerHTML = `

                <h3>
                    ${escapeHTML(
                        lesson.topic
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        lesson.subject
                    )}

                    • Teacher:

                    ${escapeHTML(
                        lesson.teacher
                    )}
                </p>

                <div class="lesson-date">
                    ${escapeHTML(
                        lesson.date
                    )}
                </div>

            `;


            card.appendChild(
                content
            );


            // ==================================
            // SAVED RECORDING
            // ==================================

            if (lesson.audioSaved) {

                const recordingBox =
                    document.createElement(
                        "div"
                    );


                recordingBox.className =
                    "recording-player";


                const label =
                    document.createElement(
                        "div"
                    );


                label.className =
                    "recording-player-label";


                label.textContent =
                    "🎙️ Saved Lecture Recording";


                recordingBox.appendChild(
                    label
                );


                // ==================================
                // REAL AUDIO PLAYER
                // ==================================

                const audio =
                    document.createElement(
                        "audio"
                    );


                audio.controls =
                    true;


                audio.preload =
                    "metadata";


                audio.setAttribute(
                    "playsinline",
                    ""
                );


                audio.style.display =
                    "block";


                audio.style.width =
                    "100%";


                // ==================================
                // LOAD AUDIO FROM INDEXED DB
                // ==================================

                loadRecordingIntoPlayer(
                    lesson.id,
                    audio
                );


                recordingBox.appendChild(
                    audio
                );


                // ==================================
                // STATUS
                // ==================================

                const savedText =
                    document.createElement(
                        "div"
                    );


                savedText.className =
                    "recording-saved-text";


                savedText.textContent =
                    "✓ Recording saved on this device";


                recordingBox.appendChild(
                    savedText
                );


                // ==================================
                // OPTIONAL PLAY BUTTON
                // ==================================

                const playButton =
                    document.createElement(
                        "button"
                    );


                playButton.type =
                    "button";


                playButton.className =
                    "play-recording-btn";


                playButton.textContent =
                    "▶ Play Recording";


                playButton.addEventListener(
                    "click",
                    async function () {

                        try {

                            await audio.play();

                        } catch (error) {

                            console.error(
                                "Audio play failed:",
                                error
                            );


                            alert(
                                "Tap the play button on the audio player above to start the recording."
                            );

                        }

                    }
                );

async function loadRecordingIntoPlayer(
    lessonId,
    audioElement
) {

    try {

        const db =
            await openAudioDatabase();


        const recording =
            await new Promise(
                function (
                    resolve,
                    reject
                ) {

                    const transaction =
                        db.transaction(
                            AUDIO_STORE_NAME,
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            AUDIO_STORE_NAME
                        );


                    const request =
                        store.get(
                            lessonId
                        );


                    request.onsuccess =
                        function () {

                            resolve(
                                request.result
                            );

                        };


                    request.onerror =
                        function () {

                            reject(
                                request.error
                            );

                        };


                    transaction.oncomplete =
                        function () {

                            db.close();

                        };

                }
            );


        if (!recording) {

            console.error(
                "No recording found for lesson:",
                lessonId
            );

            return;

        }


        if (!recording.audio) {

            console.error(
                "Recording exists but contains no audio."
            );

            return;

        }


        console.log(
            "Loading saved audio:",
            recording.audio
        );


        // ==================================
        // CREATE BROWSER AUDIO URL
        // ==================================

        const audioUrl =
            URL.createObjectURL(
                recording.audio
            );


        // ==================================
        // GIVE URL TO AUDIO PLAYER
        // ==================================

        audioElement.src =
            audioUrl;


        audioElement.load();


        // ==================================
        // CLEAN UP WHEN PAGE IS LEFT
        // ==================================

        audioElement.addEventListener(
            "emptied",
            function () {

                URL.revokeObjectURL(
                    audioUrl
                );

            }
        );


        console.log(
            "Saved recording loaded into audio player."
        );


    } catch (error) {

        console.error(
            "Could not load saved recording:",
            error
        );

    }

}
                recordingBox.appendChild(
                    playButton
                );


                card.appendChild(
                    recordingBox
                );

            }


            lessonList.appendChild(
                card
            );

        }
    );

}


// ==========================================
// HTML SECURITY
// ==========================================

function escapeHTML(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// ==========================================
// START APPLICATION
// ==========================================

renderLessons();
