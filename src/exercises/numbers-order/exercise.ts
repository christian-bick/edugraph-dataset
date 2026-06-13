import { random } from "../../lib/random.ts";
import "./exercise.scss";
import { getParams } from "../../lib/params.ts";

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getRandomUniqueNumbers(source: number[], count: number): number[] {
    const shuffled = shuffleArray(source);
    return shuffled.slice(0, count);
}

function getConfig() {
    const params = getParams(['includesZero', 'desc']);
    return {
        includesZero: params.includesZero === 'true',
        desc: params.desc === 'true',
    };
}

function createProblemHTML(problem: number[], desc: boolean, isAnswer: boolean) {
    const unorderedNumbersHTML = problem.map(n => `<div class="number-box">${n}</div>`).join('');
    const sortedNumbers = [...problem].sort((a, b) => desc ? b - a : a - b);

    const orderedBoxesHTML = sortedNumbers.map((n) => {
        return `<div class="writing-box ${isAnswer ? 'answer' : ''}">${isAnswer ? n : ''}</div>`;
    }).join('');

    const arrowSymbol = desc ? '↘' : '↗';

    return `
        <div class="problem-row">
            <div class="unordered-numbers">${unorderedNumbersHTML}</div>
            <div class="arrow">${arrowSymbol}</div>
            <div class="writing-boxes">${orderedBoxesHTML}</div>
        </div>`;
}

const config = getConfig();
const numberSet = config.includesZero
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    : [1, 2, 3, 4, 5, 6, 7, 8, 9];

const problem = getRandomUniqueNumbers(numberSet, 5);

const exerciseContainer = document.getElementById('exercise');
const answerContainer = document.getElementById('answer');

if (exerciseContainer && answerContainer) {
    exerciseContainer.innerHTML = createProblemHTML(problem, config.desc, false);
    answerContainer.innerHTML = createProblemHTML(problem, config.desc, true);
}
