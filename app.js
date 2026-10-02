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
// STORAGE KEY
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

            transcript: ""

        };


        lessons.unshift(newLesson);


        saveLessons(lessons);


        lessonForm.reset();


        closeLessonModal();


        renderLessons();

    }
);


// ------------------------------------------
// DISPLAY LESSONS
// ------------------------------------------

function renderLessons() {

    const lessons = getLessons();


    // Update statistics

    lessonCount.textContent =
        lessons.length;


    notesCount.textContent =
        lessons.filter(
            lesson => lesson.notes
        ).length;


    const totalMinutes =
        lessons.reduce(
            (total, lesson) =>
                total + Number(lesson.duration || 0),
            0
        );


    studyTime.textContent =
        `${totalMinutes} min`;


    // Clear current lesson cards

    const existingCards =
        lessonList.querySelectorAll(
            ".lesson-card"
        );

    existingCards.forEach(
        card => card.remove()
    );


    // Show empty state

    if (lessons.length === 0) {

        emptyState.style.display = "block";

        return;
    }


    // Hide empty state

    emptyState.style.display = "none";


    // Show lessons

    lessons.forEach(function (lesson) {

        const card =
            document.createElement("div");

        card.className =
            "lesson-card";


        card.innerHTML = `

            <div>

                <h3>
                    ${escapeHTML(lesson.topic)}
                </h3>

                <p>
                    ${escapeHTML(lesson.subject)}
                    • Teacher:
                    ${escapeHTML(lesson.teacher)}
                </p>

            </div>

            <div>

                <div class="lesson-date">
                    ${escapeHTML(lesson.date)}
                </div>

            </div>

        `;


        lessonList.appendChild(card);

    });

}


// ------------------------------------------
// BASIC HTML SECURITY
// ------------------------------------------

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ------------------------------------------
// START APPLICATION
// ------------------------------------------

renderLessons();
