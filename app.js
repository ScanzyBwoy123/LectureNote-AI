// ==========================================
// SAVE RECORDING
// ==========================================
async function saveRecording() {
    if (!audioChunks.length) {
        hideRecordingPanel();
        return;
    }

    // ==========================================
    // GET THE ACTUAL RECORDED FORMAT
    // ==========================================
    let audioType = "audio/mp4";

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
    const audioBlob = new Blob(
        audioChunks,
        {
            type: audioType
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
        const lessons = getLessons();

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
                        durationSeconds / 60
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
                new Date().toISOString();

            saveLessons(lessons);
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
            "The recording was captured, but it could not be saved."
        );
    }

    // ==========================================
    // CLEAN UP
    // ==========================================
    audioChunks = [];

    currentLesson = null;

    recordingStartTime = null;

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
    // UPDATE DASHBOARD STATISTICS
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
    // SHOW EMPTY STATE
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

            const lessonInfo =
                document.createElement(
                    "div"
                );


            lessonInfo.innerHTML = `

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
                lessonInfo
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


                // ==================================
                // RECORDING TITLE
                // ==================================

                const recordingTitle =
                    document.createElement(
                        "div"
                    );


                recordingTitle.className =
                    "recording-player-label";


                recordingTitle.textContent =
                    "🎙️ Saved Lecture Recording";


                recordingBox.appendChild(
                    recordingTitle
                );


                // ==================================
                // AUDIO PLAYER
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


                audio.style.width =
                    "100%";


                audio.style.display =
                    "block";


                recordingBox.appendChild(
                    audio
                );


                // ==================================
                // LOAD SAVED AUDIO
                // ==================================

                loadRecordingIntoPlayer(
                    lesson.id,
                    audio
                );


                // ==================================
                // SAVED STATUS
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
                    "▶️ Play Saved Lecture";


                playButton.addEventListener(
                    "click",
                    async function () {

                        try {

                            // If the audio has not
                            // finished loading yet,
                            // load it first.

                            if (
                                !audio.src ||
                                audio.src ===
                                window.location.href
                            ) {

                                await loadRecordingIntoPlayer(
                                    lesson.id,
                                    audio
                                );

                            }


                            if (
                                audio.readyState ===
                                0
                            ) {

                                await new Promise(
                                    function (
                                        resolve
                                    ) {

                                        audio.addEventListener(
                                            "loadedmetadata",
                                            resolve,
                                            {
                                                once:
                                                    true
                                            }
                                        );

                                    }
                                );

                            }


                            await audio.play();


                            playButton.textContent =
                                "⏸️ Playing Lecture...";


                        } catch (error) {

                            console.error(
                                "Playback failed:",
                                error
                            );


                            alert(
                                "The recording could not be played. Try using the play button on the audio player."
                            );


                            playButton.textContent =
                                "▶️ Play Saved Lecture";

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
                            "▶️ Play Saved Lecture";

                    }
                );


                audio.addEventListener(
                    "ended",
                    function () {

                        playButton.textContent =
                            "▶️ Play Saved Lecture";

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
            recording.audio.size === 0
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
        // SET AUDIO SOURCE
        // ==================================

        audioElement.src =
            audioURL;


        audioElement.load();


        // ==================================
        // CLEAN UP URL
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
