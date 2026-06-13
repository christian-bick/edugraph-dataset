import { random } from "../../lib/random.ts";
import "./worksheet.scss";
import { getParams } from "../../lib/params.ts";

// --- CONFIGURATION ---
const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

function getConfig() {
    const params = getParams(['count']);
    const count = parseInt(params.count || '5', 10);
    return {
        count: count,
        problemCount: count > 10 ? 5 : 8,
    };
}

// --- PROBLEM GENERATION ---
function generateProblems(count: number, numProblems: number) {
    const problems = [];
    const minCount = Math.max(1, count - 10);

    // Shuffle icons to ensure variety
    const shuffledIcons = [...ICONS].sort(() => 0.5 - random());

    for (let i = 0; i < numProblems; i++) {
        const numObjects = Math.floor(random() * (count - minCount + 1)) + minCount;
        // Use a unique icon for each problem
        const icon = shuffledIcons[i % shuffledIcons.length];
        problems.push({ numObjects, icon });
    }
    return problems;
}

// --- HTML GENERATION ---
function createProblemHTML(problem: { numObjects: number, icon: string }, showAnswer: boolean) {
    const objectsHTML = Array(problem.numObjects).fill(`<img src="/icons/counting/${problem.icon}" alt="counting object">`).join('');
    return `
        <div class="problem">
            <div class="objects-container">${objectsHTML}</div>
            <div class="answer-box">${showAnswer ? problem.numObjects : ''}</div>
        </div>`;
}

// --- MAIN LOGIC ---
const config = getConfig();
const problemSet = generateProblems(config.count, config.problemCount);

const problemsContainer = document.getElementById('problems-container');
const answersContainer = document.getElementById('answers-container');

if (problemsContainer && answersContainer) {
    problemSet.forEach((problem, index) => {
        const showAnswerForWorksheet = index === 0;
        const problemHTML = createProblemHTML(problem, showAnswerForWorksheet);
        const answerHTML = createProblemHTML(problem, true);

        problemsContainer.innerHTML += problemHTML;
        answersContainer.innerHTML += answerHTML;
    });
}
