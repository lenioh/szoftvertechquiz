let questions = [];
let usedIndices = new Set();
let currentIndex = 0;
let selectedOptions = [];
let correctCount = 0;
const maxQuestionsPerSession = 40;

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getRandomUnusedIndex() {
    const avail = questions
        .map((_, i) => i)
        .filter(i => !usedIndices.has(i));
    if (!avail.length) return null;
    const idx = avail[Math.floor(Math.random() * avail.length)];
    usedIndices.add(idx);
    return idx;
}

function clearProgressBar() {
    document.getElementById('progress-bar').innerHTML = '';
    correctCount = 0;
}

function updateCounter() {
    document.getElementById('counter').textContent =
        `${usedIndices.size}/${maxQuestionsPerSession}`;
}

function updateProgressBar(isCorrect) {
    const bar = document.getElementById('progress-bar');
    const box = document.createElement('span');
    box.className = 'progress-box ' + (isCorrect ? 'correct' : 'incorrect');
    bar.appendChild(box);
    if (isCorrect) correctCount++;
    updateCounter();
}

function showSummaryModal() {
    const percentage = ((correctCount / usedIndices.size) * 100).toFixed(1);
    document.getElementById('summary-text').textContent =
        `You answered ${correctCount} out of ${usedIndices.size} correctly. (${percentage}%)`;
    document.getElementById('summary-modal').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', async () => {
    questions = shuffle(await fetch('questions.json').then(r => r.json()));

    document.getElementById('start-btn').onclick = startQuiz;
    document.getElementById('submit-btn').onclick = handleSubmit;
    document.getElementById('next-btn').onclick = handleNext;
    document.getElementById('restart-btn').onclick = handleRestart;
    document.getElementById('modal-restart-btn').onclick = () => {
        document.getElementById('summary-modal').classList.add('hidden');
        handleRestart();
    };
});

function startQuiz() {
    document.getElementById('summary-modal').classList.add('hidden');
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-container').classList.remove('hidden');
    usedIndices.clear();
    clearProgressBar();
    updateCounter();
    currentIndex = getRandomUnusedIndex();
    showQuestion();
}

function showQuestion() {
    const q = questions[currentIndex];
    const optsSection = document.getElementById('options-section');
    const optsContainer = document.getElementById('options');
    // Remove any existing instruction paragraph first
    const oldInstruction = optsSection.querySelector('.instruction');
    if (oldInstruction) oldInstruction.remove();

    // Create and append a new one
    const instruction = document.createElement('p');
    instruction.textContent = `Select ${q.selectCount} option(s)!`;
    instruction.className = 'instruction';
    optsSection.appendChild(instruction);

    selectedOptions = [];
    document.getElementById('question-text').innerHTML = q.question;
    optsContainer.innerHTML = '';
    document.getElementById('explanation').innerHTML = '';

    // Figure out how many you must pick
    const selectCount = q.selectCount || 1;

    // Show only Submit
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    submitBtn.style.display = 'inline-block';
    submitBtn.disabled = true;
    nextBtn.style.display = 'none';

    // Render options
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.textContent = opt.text;
        btn.className = 'option-btn';
        btn.onclick = () => toggleOption(btn, idx, selectCount);
        optsContainer.appendChild(btn);
    });
}

function toggleOption(button, idx, maxSelect) {
    const i = selectedOptions.indexOf(idx);
    if (i > -1) {
        // unselect
        selectedOptions.splice(i, 1);
        button.classList.remove('selected');
    } else if (selectedOptions.length < maxSelect) {
        // select
        selectedOptions.push(idx);
        button.classList.add('selected');
    }
    // only enable Submit when exactly the right number are selected
    document.getElementById('submit-btn').disabled =
        selectedOptions.length !== maxSelect;
}

function handleSubmit() {
    const q = questions[currentIndex];
    const correctIndices = q.options
        .map((o, i) => o.correct ? i : -1)
        .filter(i => i > -1);

    // Disable & color all options
    document.querySelectorAll('.option-btn').forEach((btn, idx) => {
        btn.disabled = true;
        if (correctIndices.includes(idx)) {
            btn.style.backgroundColor = '#a4eda6';   // green for correct
        } else {
            btn.style.backgroundColor = '#ffcdd2';   // red for wrong
        }
    });

    // Render explanation as HTML (so <strong>...</strong> and <br> work)
    document.getElementById('explanation').innerHTML = q.explanation;

    // Swap Submit → Next
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
    nextBtn.disabled = false;

    // Determine multi-select correctness
    const isAllCorrect = selectedOptions.length === correctIndices.length
        && selectedOptions.every(i => correctIndices.includes(i));

    updateProgressBar(isAllCorrect);
}


function handleNext() {
    if (usedIndices.size >= maxQuestionsPerSession || usedIndices.size >= questions.length) {
        showSummaryModal();
        return;
    }
    currentIndex = getRandomUnusedIndex();
    showQuestion();
}

function handleRestart() {
    usedIndices.clear();
    correctCount = 0;
    clearProgressBar();
    updateCounter();
    currentIndex = getRandomUnusedIndex();
    showQuestion();
}