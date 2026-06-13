import { random } from "../../lib/random.ts";
import "./worksheet.scss";
import { getParams } from "../../lib/params.ts";

// --- CONFIGURATION ---
const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

function getConfig() {
    const params = getParams(['max', 'type']);
    return {
        max: parseInt(params.max || '9', 10),
        type: params.type || 'mixed',
        problemCount: 8,
    };
}

// --- PROBLEM GENERATION ---
function generateProblems(max: number, type: string, numProblems: number, exclude: {inc: number[], dec: number[], icons: string[]} = {inc: [], dec: [], icons: []}) {
    const problems = [];
    const availableIcons = ICONS.filter(icon => !exclude.icons.includes(icon));
    const shuffledIcons = [...availableIcons].sort(() => 0.5 - random());

    let problemTypes: string[] = [];
    if (type === 'mixed') {
        const numInc = Math.ceil(numProblems / 2);
        const numDec = numProblems - numInc;
        problemTypes = [...Array(numInc).fill('inc'), ...Array(numDec).fill('dec')];
        problemTypes.sort(() => 0.5 - random()); // Shuffle the types
    } else {
        problemTypes = Array(numProblems).fill(type);
    }

    for (let i = 0; i < numProblems; i++) {
        const problemType = problemTypes[i];
        let numObjects;

        if (problemType === 'dec') {
            numObjects = Math.floor(random() * (max - 2 + 1)) + 2;
            while(exclude.dec.includes(numObjects)) {
                numObjects = Math.floor(random() * (max - 2 + 1)) + 2;
            }
        } else { // 'inc'
            numObjects = Math.floor(random() * (max - 1)) + 1;
            while(exclude.inc.includes(numObjects)) {
                numObjects = Math.floor(random() * (max - 1)) + 1;
            }
        }

        const answer = problemType === 'inc' ? numObjects + 1 : numObjects - 1;
        const icon = shuffledIcons[i % shuffledIcons.length];
        problems.push({ numObjects, icon, type: problemType, answer });
    }
    return problems;
}

// --- HTML GENERATION ---
function createProblemHTML(problem: { numObjects: number, icon: string, type: string, answer: number }, showAnswer: boolean) {
    const objectsHTML = Array(problem.numObjects).fill(`<img src="/icons/counting/${problem.icon}" alt="counting object">`).join('');
    const arrowClass = problem.type === 'inc' ? 'triangle-up' : 'triangle-down';
    return `
        <div class="problem">
            <div class="objects-container">${objectsHTML}</div>
            <div class="answer-container">
                <div class="${arrowClass}"></div>
                <div class="answer-box">${showAnswer ? problem.answer : ''}</div>
            </div>
        </div>`;
}

// --- MAIN LOGIC ---
const config = getConfig();
const problemsContainer = document.getElementById('problems-container');
const answersContainer = document.getElementById('answers-container');

if (problemsContainer && answersContainer) {
    if (config.type === 'mixed') {
        const incExample = generateProblems(config.max, 'inc', 1)[0];
        const decExample = generateProblems(config.max, 'dec', 1, {inc: [], dec: [incExample.numObjects], icons: [incExample.icon]})[0];

        // Render examples
        problemsContainer.innerHTML += createProblemHTML(incExample, true);
        answersContainer.innerHTML += createProblemHTML(incExample, true);
        problemsContainer.innerHTML += createProblemHTML(decExample, true);
        answersContainer.innerHTML += createProblemHTML(decExample, true);

        // Generate and render the rest of the problems
        const remainingProblems = generateProblems(config.max, 'mixed', config.problemCount - 2, {inc: [incExample.numObjects], dec: [decExample.numObjects], icons: [incExample.icon, decExample.icon]});
        remainingProblems.forEach(problem => {
            const problemHTML = createProblemHTML(problem, false);
            const answerHTML = createProblemHTML(problem, true);
            problemsContainer.innerHTML += problemHTML;
            answersContainer.innerHTML += answerHTML;
        });

    } else {
        const problemSet = generateProblems(config.max, config.type, config.problemCount);
        problemSet.forEach((problem, index) => {
            const showAnswerForWorksheet = index === 0;
            const problemHTML = createProblemHTML(problem, showAnswerForWorksheet);
            const answerHTML = createProblemHTML(problem, true);

            problemsContainer.innerHTML += problemHTML;
            answersContainer.innerHTML += answerHTML;
        });
    }
}
