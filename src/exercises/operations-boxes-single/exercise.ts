import { random } from "../../lib/random.ts";
import "./exercise.scss"
import {getParams} from "../../lib/params.ts";
import {generateProblem} from "../../lib/single-digit-problems.ts"

function getConfig() {
    const params = getParams(['operations', 'allowNegatives', 'blankPart', 'includeTenCarry', 'includeZero'])
    return {
        operations: params.operations ? params.operations.split(',') : ['add'],
        allowNegatives: params.allowNegatives === 'true' || params.allowNegatives === '1',
        includeTenCarry: params.includeTenCarry === 'true' || params.includeTenCarry === '1',
        includeZero: params.includeZero === 'true' || params.includeZero === '1',
        blankPart: params.blankPart || 'answer'
    }
}

const config = getConfig()
const operation = config.operations[Math.floor(random() * config.operations.length)];
const problem = generateProblem(operation, {
    operations: config.operations,
    problemCount: 1,
    allowNegatives: config.allowNegatives,
    includeTenCarry: config.includeTenCarry,
    includeZero: config.includeZero
})

function createProblemHTML(problem: any, blankPart: string, isAnswer: boolean) {
    const displayProblem = { ...problem };
    if (!isAnswer) {
        if (blankPart === 'symbol') {
            displayProblem.symbol = '';
        } else {
            displayProblem[blankPart] = '';
        }
    }

    const getClass = (partName: string, baseClass: string) => {
        let cls = baseClass;
        if (isAnswer && blankPart === partName) {
            cls += ' solution';
        }
        return cls;
    };

    return `
        <div class="problem">
            <div class="${getClass('num1', 'box')}">${displayProblem.num1}</div>
            <div class="${getClass('symbol', 'symbol')}">${displayProblem.symbol}</div>
            <div class="${getClass('num2', 'box')}">${displayProblem.num2}</div>
            <div class="symbol">=</div>
            <div class="${getClass('answer', 'box answer-box')}">${displayProblem.answer}</div>
        </div>`;
}

const exerciseContainer = document.getElementById('exercise');
const answerContainer = document.getElementById('answer');

if (exerciseContainer && answerContainer) {
    let blankPartKey = '';
    switch (config.blankPart) {
        case 'problem': {
            const parts = ['num1', 'num2'];
            blankPartKey = parts[Math.floor(random() * parts.length)];
            break;
        }
        case 'problem-answer': {
            const parts = ['num1', 'num2', 'answer'];
            blankPartKey = parts[Math.floor(random() * parts.length)];
            break;
        }
        case 'operator':
            blankPartKey = 'symbol';
            break;
        case 'random': {
            const allParts = ['num1', 'num2', 'answer', 'symbol'];
            blankPartKey = allParts[Math.floor(random() * allParts.length)];
            break;
        }
        case 'answer':
        default:
            blankPartKey = 'answer';
            break;
    }

    exerciseContainer.innerHTML = createProblemHTML(problem, blankPartKey, false);
    answerContainer.innerHTML = createProblemHTML(problem, blankPartKey, true);
}
