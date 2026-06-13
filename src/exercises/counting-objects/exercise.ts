import { random } from "../../lib/random.ts";
import "./exercise.scss";
import { getParams } from "../../lib/params.ts";

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

function getConfig() {
    const params = getParams(['count']);
    const maxCount = parseInt(params.count || '5', 10);
    return {
        maxCount: maxCount,
    };
}

function generateProblem(maxCount: number) {
    const minCount = Math.max(1, maxCount - 9); // e.g. for count=10, minCount=1; for count=20, minCount=11
    const numObjects = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
    const icon = ICONS[Math.floor(random() * ICONS.length)];
    return { numObjects, icon };
}

function createProblemHTML(problem: { numObjects: number, icon: string }, showAnswer: boolean) {
    const objectsHTML = Array(problem.numObjects).fill(`<img src="/icons/counting/${problem.icon}" alt="counting object">`).join('');
    return `
        <div class="problem">
            <div class="objects-container">${objectsHTML}</div>
            <div class="answer-box">${showAnswer ? problem.numObjects : ''}</div>
        </div>`;
}

const config = getConfig();
const problem = generateProblem(config.maxCount);

const exerciseContainer = document.getElementById('exercise');
const answerContainer = document.getElementById('answer');

if (exerciseContainer && answerContainer) {
    exerciseContainer.innerHTML = createProblemHTML(problem, false);
    answerContainer.innerHTML = createProblemHTML(problem, true);
}
