// ==========================================
// LectureNote AI
// Main Application JavaScript
// ==========================================


// ------------------------------------------
// GET ELEMENTS
// ------------------------------------------

const newLessonBtn = document.getElementById("newLessonBtn");
const startLessonBtn = document.getElementById("startLessonBtn");
const emptyStartBtn = document.getElementById("emptyStartBtn");

const lessonModal = document.getElementById("lessonModal");
const closeModalBtn = document.getElementById("closeModalBtn");

const lessonForm = document.getElementById("lessonForm");

const lessonList = document.getElementById("lessonList");
const emptyState = document.getElementById("emptyState");

const lessonCount = document.getElementById("lessonCount");
const notesCount = document.getElementById("notesCount");
const studyTime = document.getElementById("studyTime");


// ------------------------------------------
// STORAGE
// ------------------------------------------

const STORAGE_KEY = "lectureNoteAI_lessons";


// ------------------------------------------
// OPEN LESSON MODAL
// ------------------------------------------

function openLessonModal() {
    lessonModal.classList.remove("hidden");
}


// ------------------------------------------
// CLOSE LESSON MODAL
// ------------------------------------------

function closeLessonModal() {
    lessonModal.classList.add("hidden");
}


// ------------------------------------------
// BUTTON EVENTS
// ------------------------------------------

newLessonBtn.addEventListener("click", openLessonModal);

startLessonBtn.addEventListener("click", openLessonModal);

emptyStartBtn.addEventListener("click", openLessonModal);

closeModalBtn.addEventListener("click", closeLessonModal);


// ------------------------------------------
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ------------------------------------------

lessonModal.addEventListener("click", function (event) {

    if (event.target === lessonModal) {
        closeLessonModal();
    }

});


// ------------------------------------------
// LOAD LESSONS
// ------------------------------------------

function getLessons() {

    const savedLessons =
        localStorage.getItem(STORAGE_KEY);

    if (!savedLessons) {
        return [];
    }

    try {

        return JSON.parse(savedLessons);

    } catch (error) {

        console.error(
            "Could not load lessons:",
            error
        );

        return [];
    }
}


// ------------------------------------------
// SAVE LESSONS
// ------------------------------------------

function saveLessons(lessons) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(lessons)
    );

}


// ------------------------------------------
// CREATE LESSON
// ------------------------------------------

lessonForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const subject =
            document.getElementById("subject").value.trim();

        const topic =
            document.getElementById("topic").value.trim();

        const teacher =
            document.getElementById("teacher").value.trim();


        if (!subject || !topic) {
            return;
        }


        const lessons = getLessons();


        const newLesson = {

            id: Date.now(),

            subject: subject,

            topic: topic,

            teacher: teacher || "Not specified",

            date: new Date().toLocaleDateString(
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


        lessons.unshift(newLesson);


        saveLessons(lessons);


        lessonForm.reset();


        closeLessonModal();


        // Start the microphone
        startMicrophone(newLesson);

    }
);


// ==========================================
// MICROPHONE SYSTEM
// ==========================================


// ------------------------------------------
// MICROPHONE VARIABLES
// ------------------------------------------

let microphoneStream = null;

let mediaRecorder = null;

let audioChunks = [];

let currentLesson = null;

let recordingStartTime = null;

let recordingTimer = null;


// ------------------------------------------
// START MICROPHONE
// ------------------------------------------

async function startMicrophone(lesson) {

    currentLesson = lesson;

    audioChunks = [];

    try {

        microphoneStream =
            await navigator.mediaDevices.getUserMedia({

                audio: {

                    // Reduce background noise
                    noiseSuppression: true,

                    // Reduce echo
                    echoCancellation: true,

                    // Automatically adjust microphone volume
                    autoGainControl: true,

                    // Prefer a single microphone channel
                    channelCount: 1

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


// ------------------------------------------
// CHECK MICROPHONE SETTINGS
// ------------------------------------------

function getTrackSetting(settingName) {

    if (!microphoneStream) {
        return "Unavailable";
    }


    const tracks =
        microphoneStream.getAudioTracks();


    if (!tracks.length) {
        return "Unavailable";
    }


    const settings =
        tracks[0].getSettings();


    return settings[settingName] ?? "Not reported";

}


// ------------------------------------------
// START RECORDING
// ------------------------------------------

function startRecording() {

    if (!microphoneStream) {
        return;
    }


    audioChunks = [];


    mediaRecorder =
        new MediaRecorder(
            microphoneStream
        );


    mediaRecorder.addEventListener(
        "dataavailable",
        function (event) {

            if (event.data.size > 0) {

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


    recordingTimer =
        setInterval(
            updateRecordingTime,
            1000
        );


    console.log(
        "Recording started."
    );

}


// ------------------------------------------
// UPDATE RECORDING TIMER
// ------------------------------------------

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


    console.log(
        "Recording time:",
        formatTime(seconds)
    );

}


// ------------------------------------------
// FORMAT TIME
// ------------------------------------------

function formatTime(seconds) {

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

        String(hours).padStart(2, "0"),

        String(minutes).padStart(2, "0"),

        String(remainingSeconds).padStart(2, "0")

    ].join(":");

}


// ------------------------------------------
// STOP RECORDING
// ------------------------------------------

function stopRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state !== "inactive"
    ) {

        mediaRecorder.stop();

    }


    if (recordingTimer) {

        clearInterval(
            recordingTimer
        );

        recordingTimer = null;

    }


    if (microphoneStream) {

        microphoneStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        microphoneStream = null;

    }


    console.log(
        "Recording stopped."
    );

}


// ------------------------------------------
// SAVE RECORDING
// ------------------------------------------

function saveRecording() {

    if (!audioChunks.length) {
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


    // For now we keep the recording in memory.
    // We will add proper lesson audio storage later.

    const duration =
        recordingStartTime
            ? Math.floor(
                (
                    Date.now() -
                    recordingStartTime
                ) / 60000
            )
            : 0;


    if (currentLesson) {

        const lessons =
            getLessons();


        const index =
            lessons.findIndex(
                lesson =>
                    lesson.id ===
                    currentLesson.id
            );


        if (index !== -1) {

            lessons[index].duration =
                Math.max(
                    duration,
                    1
                );


            saveLessons(lessons);

        }

    }


    renderLessons();

}


// ------------------------------------------
// DISPLAY LESSONS
// ------------------------------------------

function renderLessons() {

    const lessons = getLessons();


    lessonCount.textContent =
        lessons.length;


    notesCount.textContent =
        lessons.filter(
            lesson => lesson.notes
        ).length;


    const totalMinutes =
        lessons.reduce(
            (total, lesson) =>
                total +
                Number(
                    lesson.duration || 0
                ),
            0
        );


    studyTime.textContent =
        `${totalMinutes} min`;


    const existingCards =
        lessonList.querySelectorAll(
            ".lesson-card"
        );


    existingCards.forEach(
        card => card.remove()
    );


    if (lessons.length === 0) {

        emptyState.style.display =
            "block";

        return;
    }


    emptyState.style.display =
        "none";


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


// ------------------------------------------
// BASIC HTML SECURITY
// ------------------------------------------

function escapeHTML(value) {

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


// ------------------------------------------
// START APPLICATION
// ------------------------------------------

renderLessons();
