import "./exercise.scss"
import {getParams} from "../../lib/params.ts";
import {generateProblemSet, Problem} from "../../lib/comparison-problems.ts"

function getConfig() {
    const params = getParams(['digits', 'includesZero'])
    return {
        digits: parseInt(params.digits || '1', 10),
        includesZero: params.includesZero === 'true',
    }
}

function createProblemHTML(problem: Problem, isAnswer: boolean) {
    return `
        <div class="problem">
            <span class="number">${problem.num1}</span>
            <span class="answer-box">${isAnswer ? problem.answer : ''}</span>
            <span class="number">${problem.num2}</span>
        </div>`;
}

const config = getConfig();
const [problem] = generateProblemSet({ ...config, problemCount: 1 });

const exerciseContainer = document.getElementById('exercise');
const answerContainer = document.getElementById('answer');

if (exerciseContainer && answerContainer) {
    exerciseContainer.innerHTML = createProblemHTML(problem, false);
    answerContainer.innerHTML = createProblemHTML(problem, true);
}
