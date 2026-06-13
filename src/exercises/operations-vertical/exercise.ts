import "./exercise.scss"
import {getParams} from "../../lib/params.ts";
import {generateProblemSet, Problem} from "../../lib/arithmetic-problems.ts"

function getConfig() {
    const params = getParams(['operations', 'digitsNum1', 'digitsNum2', 'allowNegatives'])
    return {
        operations: params.operations ? params.operations.split(',') : ['add'],
        digitsNum1: parseInt(params.digitsNum1 || '0', 10),
        digitsNum2: parseInt(params.digitsNum2 || '0', 10),
        allowNegatives: params.allowNegatives === 'true' || params.allowNegatives === '1',
        maxDigits: 5,
        problemCount: 1
    }
}

function createProblemHTML(problem: Problem, isAnswer: boolean) {
    return `
        <div class="problem">
            <span class="number">${problem.num1}</span>
            <span class="number">
                <span class="operator">${problem.symbol}</span>${problem.num2}
            </span>
            <div class="line"></div>
            <div class="answer-box ${isAnswer ? 'solution' : ''}">${isAnswer ? problem.answer : ''}</div>
        </div>`;
}

const config = getConfig();
const [problem] = generateProblemSet(config);

const exerciseContainer = document.getElementById('exercise');
const answerContainer = document.getElementById('answer');

if (exerciseContainer && answerContainer) {
    exerciseContainer.innerHTML = createProblemHTML(problem, false);
    answerContainer.innerHTML = createProblemHTML(problem, true);
}
