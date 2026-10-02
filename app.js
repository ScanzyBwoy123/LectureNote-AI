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
// STORAGE
// ==========================================

const STORAGE_KEY =
    "lectureNoteAI_lessons";


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

    lessonModal.classList.remove("hidden");

}


// ==========================================
// CLOSE LESSON MODAL
// ==========================================

function closeLessonModal() {

    if (!lessonModal) {
        return;
    }

    lessonModal.classList.add("hidden");

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
// CLOSE MODAL WHEN CLICKING OUTSIDE
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
// STORAGE FUNCTIONS
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


function saveLessons(lessons) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(lessons)
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
                    .getElementById("subject")
                    ?.value
                    .trim();


            const topic =
                document
                    .getElementById("topic")
                    ?.value
                    .trim();


            const teacher =
                document
                    .getElementById("teacher")
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

                id: Date.now(),

                subject: subject,

                topic: topic,

                teacher:
                    teacher ||
                    "Not specified",

                date:
                    new Date()
                        .toLocaleDateString(
                            undefined,
                            {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                            }
                        ),

                duration: 0,

                notes: "",

                transcript: "",

                audio: null

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


            // Start microphone
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

    currentLesson = lesson;

    audioChunks = [];


    // Check browser support
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

                        // Reduce background noise
                        noiseSuppression: true,

                        // Reduce echo
                        echoCancellation: true,

                        // Automatically control microphone volume
                        autoGainControl: true,

                        // Use one audio channel
                        channelCount: 1

                    }

                });


        console.log(
            "Microphone permission granted."
        );


        // Show actual browser microphone settings
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
        document.querySelector("main");


    if (!main) {

        console.warn(
            "Main dashboard element not found."
        );

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


    // Make sure the panel is outside
    // the lesson creation modal.
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


    audioChunks = [];


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


    // ======================================
    // AUDIO DATA
    // ======================================

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


    // ======================================
    // RECORDING STOPPED
    // ======================================

    mediaRecorder.addEventListener(
        "stop",
        function () {

            saveRecording();

        }
    );


    // ======================================
    // START
    // ======================================

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
// UPDATE RECORDING TIMER
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


    const formatted =
        formatTime(
            seconds
        );


    if (recordingTimerElement) {

        recordingTimerElement.textContent =
            formatted;

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
            .padStart(2, "0"),

        String(minutes)
            .padStart(2, "0"),

        String(
            remainingSeconds
        ).padStart(2, "0")

    ].join(":");

}


// ==========================================
// STOP RECORDING
// ==========================================

function stopRecording() {

    // Stop MediaRecorder
    if (
        mediaRecorder &&
        mediaRecorder.state !==
        "inactive"
    ) {

        mediaRecorder.stop();

    }


    // Stop timer
    if (recordingTimer) {

        clearInterval(
            recordingTimer
        );

        recordingTimer = null;

    }


    // Stop microphone
    if (microphoneStream) {

        microphoneStream
            .getTracks()
            .forEach(
                function (track) {

                    track.stop();

                }
            );


        microphoneStream = null;

    }


    if (recordingStatusText) {

        recordingStatusText.textContent =
            "Lesson stopped";

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

function saveRecording() {

    if (!audioChunks.length) {

        hideRecordingPanel();

        return;

    }


    const audioBlob =
        new Blob(
            audioChunks,
            {
                type: "audio/webm"
            }
        );


    console.log(
        "Audio captured:",
        audioBlob.size,
        "bytes"
    );


    // Calculate recording duration
    const duration =
        recordingStartTime
            ? Math.floor(
                (
                    Date.now() -
                    recordingStartTime
                ) / 60000
            )
            : 0;


    // Update current lesson
    if (currentLesson) {

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
                    duration,
                    1
                );


            saveLessons(
                lessons
            );

        }

    }


    renderLessons();


    // ======================================
    // IMPORTANT
    // ======================================
    // The audio is currently kept in memory.
    // Later we can add permanent audio storage
    // and AI transcription.

    console.log(
        "Recording saved in memory."
    );


    // Clear recording data
    audioChunks = [];

    currentLesson = null;

    recordingStartTime = null;


    // Keep "Lesson stopped" visible
    // briefly before hiding the panel.
    setTimeout(
        function () {

            hideRecordingPanel();

        },
        1500
    );

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


    // Lesson count
    if (lessonCount) {

        lessonCount.textContent =
            lessons.length;

    }


    // Notes count
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


    // Total study time
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


    // Remove old lesson cards
    const existingCards =
        lessonList.querySelectorAll(
            ".lesson-card"
        );


    existingCards.forEach(
        function (card) {

            card.remove();

        }
    );


    // No lessons
    if (lessons.length === 0) {

        emptyState.style.display =
            "block";

        return;

    }


    // Has lessons
    emptyState.style.display =
        "none";


    // Create lesson cards
    lessons.forEach(
        function (lesson) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "lesson-card";


            card.innerHTML = `

                <div>

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

                </div>

                <div>

                    <div class="lesson-date">

                        ${escapeHTML(
                            lesson.date
                        )}

                    </div>

                </div>

            `;


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
