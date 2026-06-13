import "./exercise.scss"
import {getParams} from "../../lib/params.ts";
import {generateProblem} from "../../lib/arithmetic-problems.ts"

function getConfig() {
    const params = getParams(['operations', 'allowNegatives', 'blankPart', 'digitsNum1', 'digitsNum2', 'maxDigits'])
    return {
        operations: params.operations ? params.operations.split(',') : ['add'],
        allowNegatives: params.allowNegatives === 'true' || params.allowNegatives === '1',
        digitsNum1: params.digitsNum1 ? parseInt(params.digitsNum1, 10) : undefined,
        digitsNum2: params.digitsNum2 ? parseInt(params.digitsNum2, 10) : undefined,
        maxDigits: params.maxDigits ? parseInt(params.maxDigits, 10) : 5,
        blankPart: params.blankPart || 'answer'
    }
}

const config = getConfig()
const operation = config.operations[Math.floor(Math.random() * config.operations.length)];
const problem = generateProblem(operation, {
    operations: config.operations,
    problemCount: 1,
    allowNegatives: config.allowNegatives,
    digitsNum1: config.digitsNum1,
    digitsNum2: config.digitsNum2,
    maxDigits: config.maxDigits
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
            blankPartKey = parts[Math.floor(Math.random() * parts.length)];
            break;
        }
        case 'problem-answer': {
            const parts = ['num1', 'num2', 'answer'];
            blankPartKey = parts[Math.floor(Math.random() * parts.length)];
            break;
        }
        case 'operator':
            blankPartKey = 'symbol';
            break;
        case 'random': {
            const allParts = ['num1', 'num2', 'answer', 'symbol'];
            blankPartKey = allParts[Math.floor(Math.random() * allParts.length)];
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
