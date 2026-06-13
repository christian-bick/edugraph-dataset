import "./exercise.scss";
import { getParams } from "../../lib/params.ts";

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

function getConfig() {
    const params = getParams(['max', 'type']);
    return {
        max: parseInt(params.max || '9', 10),
        type: params.type || 'mixed',
    };
}

function generateProblem(max: number, type: string) {
    const problemType = type === 'mixed' ? (Math.random() < 0.5 ? 'inc' : 'dec') : type;
    let numObjects;

    if (problemType === 'dec') {
        numObjects = Math.floor(Math.random() * (max - 2 + 1)) + 2;
    } else { // 'inc'
        numObjects = Math.floor(Math.random() * (max - 1)) + 1;
    }

    const answer = problemType === 'inc' ? numObjects + 1 : numObjects - 1;
    const icon = ICONS[Math.floor(Math.random() * ICONS.length)];
    return { numObjects, icon, type: problemType, answer };
}

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

const config = getConfig();
const problem = generateProblem(config.max, config.type);

const exerciseContainer = document.getElementById('exercise');
const answerContainer = document.getElementById('answer');

if (exerciseContainer && answerContainer) {
    exerciseContainer.innerHTML = createProblemHTML(problem, false);
    answerContainer.innerHTML = createProblemHTML(problem, true);
}
