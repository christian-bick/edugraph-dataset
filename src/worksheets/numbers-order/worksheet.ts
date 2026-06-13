import { random } from "../../lib/random.ts";
import "./worksheet.scss";
import { getParams } from "../../lib/params.ts";

// --- UTILITY FUNCTIONS ---
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

// --- PROBLEM GENERATION ---
function generateProblems(params: { [key: string]: any }): number[][] {
    const { includesZero } = params;
    const numberSet = includesZero
        ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        : [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const problems = [];
    for (let i = 0; i < 8; i++) { // Generate 8 problems per worksheet
        problems.push(getRandomUniqueNumbers(numberSet, 5));
    }
    return problems;
}

// --- CONFIGURATION ---
function getConfig() {
    const params = getParams(['includesZero', 'desc']);
    return {
        includesZero: params.includesZero ? params.includesZero === 'true' : false,
        desc: params.desc ? params.desc === 'true' : false,
    };
}

// --- HTML GENERATION ---
function createProblemRowHTML(problem: number[], isFirstRow: boolean, desc: boolean, isAnswerKey: boolean): string {
    const unorderedNumbersHTML = problem.map(n => `<div class="number-box">${n}</div>`).join('');

    const sortedNumbers = [...problem].sort((a, b) => desc ? b - a : a - b);

    const orderedBoxesHTML = sortedNumbers.map((n) => {
        let boxClass = 'writing-box';
        let content: number | string = '';

        if (isAnswerKey) {
            boxClass += ' answer';
            content = n;
        } else {
            boxClass += isFirstRow ? ' example' : '';
            content = isFirstRow ? n : '';
        }
        return `<div class="${boxClass}">${content}</div>`;
    }).join('');

    return `
        <div class="problem-row">
            <div class="unordered-numbers">${unorderedNumbersHTML}</div>
            <div class="arrow">→</div>
            <div class="writing-boxes">${orderedBoxesHTML}</div>
        </div>`;
}

// --- MAIN LOGIC ---
const config = getConfig();
const problemsContainer = document.getElementById('problems-container');
const answersContainer = document.getElementById('answers-container'); // Get answers container

if (problemsContainer && answersContainer) { // Check both containers
    const problems = generateProblems(config);
    problems.forEach((problem, index) => {
        const isFirstRow = index === 0;
        
        // For Worksheet
        const problemRowHTML = createProblemRowHTML(problem, isFirstRow, config.desc, false); // isAnswerKey = false
        problemsContainer.innerHTML += problemRowHTML;

        // For Answer Key
        const answerRowHTML = createProblemRowHTML(problem, isFirstRow, config.desc, true); // isAnswerKey = true
        answersContainer.innerHTML += answerRowHTML;
    });
}