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
// FIND SUPPORTED RECORDING FORMAT
// ==========================================

function getSupportedAudioMimeType() {

    if (
        typeof MediaRecorder ===
        "undefined"
    ) {

        return "";

    }


    const supportedTypes = [

        "audio/mp4",

        "audio/webm;codecs=opus",

        "audio/webm",

        "audio/ogg;codecs=opus",

        "audio/ogg"

    ];


    for (
        let i = 0;
        i < supportedTypes.length;
        i++
    ) {

        const type =
            supportedTypes[i];


        if (
            MediaRecorder.isTypeSupported(
                type
            )
        ) {

            return type;

        }

    }


    return "";

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

        const supportedMimeType =
            getSupportedAudioMimeType();


        console.log(
            "Selected recording format:",
            supportedMimeType ||
            "Browser default"
        );


        if (supportedMimeType) {

            mediaRecorder =
                new MediaRecorder(
                    microphoneStream,
                    {
                        mimeType:
                            supportedMimeType
                    }
                );

        } else {

            mediaRecorder =
                new MediaRecorder(
                    microphoneStream
                );

        }

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


    // ==========================================
    // DETERMINE ACTUAL RECORDED FORMAT
    // ==========================================

    let audioType =
        "audio/webm";


    if (
        mediaRecorder &&
        mediaRecorder.mimeType
    ) {

        audioType =
            mediaRecorder.mimeType;

    }


    console.log(
        "Actual MediaRecorder MIME type:",
        audioType
    );


    // ==========================================
    // CREATE AUDIO BLOB
    // ==========================================

    const audioBlob =
        new Blob(
            audioChunks,
            {
                type:
                    audioType
            }
        );


    // ==========================================
    // CALCULATE DURATION
    // ==========================================

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


    console.log(
        "Audio MIME type:",
        audioBlob.type
    );


    // ==========================================
    // MAKE SURE LESSON EXISTS
    // ==========================================

    if (!currentLesson) {

        console.error(
            "No current lesson."
        );

        return;

    }


    try {

        // ======================================
        // SAVE ACTUAL AUDIO
        // ======================================

        await saveAudioToDatabase(
            currentLesson.id,
            audioBlob,
            durationSeconds
        );


        // ======================================
        // UPDATE LESSON
        // ======================================

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
                audioType;


            lessons[index].audioSize =
                audioBlob.size;


            lessons[index].audioSavedAt =
                new Date()
                    .toISOString();


            saveLessons(
                lessons
            );

        }


        // ======================================
        // SUCCESS MESSAGE
        // ======================================

        if (recordingStatusText) {

            recordingStatusText.textContent =
                "✓ Recording saved on this device";

        }


        console.log(
            "Recording permanently saved."
        );


        console.log(
            "Saved format:",
            audioType
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


    // ==========================================
    // CLEAN UP
    // ==========================================

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

async function playSavedRecording(
    lessonId
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


        const audioBlob =
            recording.audio;


        console.log(
            "Saved recording found:",
            recording
        );


        console.log(
            "Audio type:",
            audioBlob.type
        );


        console.log(
            "Audio size:",
            audioBlob.size
        );


        if (
            audioBlob.size ===
            0
        ) {

            alert(
                "The saved audio file is empty."
            );

            return;

        }


        const audioUrl =
            URL.createObjectURL(
                audioBlob
            );


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
// LOAD SAVED RECORDING INTO AUDIO PLAYER
// ==========================================

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


        // ==================================
        // CHECK RECORDING
        // ==================================

        if (!recording) {

            console.error(
                "No saved recording found:",
                lessonId
            );

            return false;

        }


        if (!recording.audio) {

            console.error(
                "Recording exists but audio is missing."
            );

            return false;

        }


        if (
            recording.audio.size ===
            0
        ) {

            console.error(
                "Saved audio is empty."
            );

            return false;

        }


        console.log(
            "Saved recording found."
        );


        console.log(
            "Audio type:",
            recording.audio.type
        );


        console.log(
            "Audio size:",
            recording.audio.size
        );


        // ==================================
        // CREATE AUDIO URL
        // ==================================

        const audioURL =
            URL.createObjectURL(
                recording.audio
            );


        // ==================================
        // REMOVE PREVIOUS SOURCE
        // ==================================

        if (
            audioElement.src
        ) {

            try {

                URL.revokeObjectURL(
                    audioElement.src
                );

            } catch (error) {

                console.warn(
                    "Could not revoke previous audio URL:",
                    error
                );

            }

        }


        // ==================================
        // SET AUDIO SOURCE
        // ==================================

        audioElement.src =
            audioURL;


        audioElement.load();


        // ==================================
        // CLEAN UP AFTER PLAYBACK
        // ==================================

        audioElement.addEventListener(
            "ended",
            function () {

                URL.revokeObjectURL(
                    audioURL
                );

            },
            {
                once:
                    true
            }
        );


        console.log(
            "Saved recording loaded successfully."
        );


        return true;


    } catch (error) {

        console.error(
            "Could not load saved recording:",
            error
        );


        return false;

    }

}


// ==========================================
// DISPLAY LESSONS
// ==========================================

function renderLessons() {

    if (
        !lessonList ||
        !emptyState
    ) {

        return;

    }


    const lessons =
        getLessons();


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
            function (
                total,
                lesson
            ) {

                return (
                    total +
                    Number(
                        lesson.duration ||
                        0
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

    if (
        lessons.length ===
        0
    ) {

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

            if (
                lesson.audioSaved
            ) {

                const recordingBox =
                    document.createElement(
                        "div"
                    );


                recordingBox.className =
                    "recording-player";


                // ==================================
                // RECORDING TITLE
                // ==================================

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
                // LOAD SAVED AUDIO
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
                // PLAY BUTTON
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

                            const loaded =
                                await loadRecordingIntoPlayer(
                                    lesson.id,
                                    audio
                                );


                            if (!loaded) {

                                throw new Error(
                                    "Could not load saved recording."
                                );

                            }


                            await audio.play();


                            playButton.textContent =
                                "⏸️ Playing Lecture...";


                        } catch (error) {

                            console.error(
                                "Audio play failed:",
                                error
                            );


                            alert(
                                "The recording could not be played. Please try the audio player's play button."
                            );


                            playButton.textContent =
                                "▶ Play Recording";

                        }

                    }
                );


                recordingBox.appendChild(
                    playButton
                );


                // ==================================
                // AUDIO EVENTS
                // ==================================

                audio.addEventListener(
                    "play",
                    function () {

                        playButton.textContent =
                            "⏸️ Playing Lecture...";

                    }
                );


                audio.addEventListener(
                    "pause",
                    function () {

                        playButton.textContent =
                            "▶ Play Recording";

                    }
                );


                audio.addEventListener(
                    "ended",
                    function () {

                        playButton.textContent =
                            "▶ Play Recording";

                    }
                );


                audio.addEventListener(
                    "error",
                    function () {

                        console.error(
                            "Audio element error:",
                            audio.error
                        );

                    }
                );


                card.appendChild(
                    recordingBox
                );

            }


            // ==================================
            // ADD CARD TO LIBRARY
            // ==================================

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
