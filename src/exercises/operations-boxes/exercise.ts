import { random } from "../../lib/random.ts";
import "./exercise.scss";
import { RenderPayload } from "../../types/ml-engine.ts";

const operatorSymbols: { [key: string]: string } = {
    add: '+',
    subtract: '−', // Using minus sign, not hyphen
    multiply: '×',
    divide: '÷'
};

function createProblemHTML(
    data: { num1: number, num2: number, answer: number, operator: string }, 
    visualParams: any, 
    isAnswerView: boolean
) {
    const blankPart = visualParams.blankPart || 'answer';
    const symbol = operatorSymbols[data.operator] || '?';
    
    const displayProblem: any = { 
        num1: data.num1, 
        num2: data.num2, 
        answer: data.answer,
        symbol: symbol
    };

    if (!isAnswerView) {
        if (blankPart === 'symbol') {
            displayProblem.symbol = '';
        } else {
            displayProblem[blankPart] = '';
        }
    }

    const getClass = (partName: string, baseClass: string) => {
        let cls = baseClass;
        if (isAnswerView && blankPart === partName) {
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

window.renderExercise = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('exercise');
    
    // We only need one container now, but if both exist we'll just use the first or clear the DOM.
    // The orchestrator calls renderExercise twice: once with isAnswerView=false, once with true.
    if (exerciseContainer) {
        const { problem, config, isAnswerView } = payload;
        
        let blankPartKey = '';
        const requestedBlank = config.visualParams.blankPart || 'answer';
        
        switch (requestedBlank) {
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
            default:
                blankPartKey = requestedBlank;
                break;
        }

        const specificVisualParams = { ...config.visualParams, blankPart: blankPartKey };
        
        exerciseContainer.innerHTML = createProblemHTML(
            problem.data as any, 
            specificVisualParams, 
            isAnswerView
        );

        // Hide the old answer container if it exists, as the ML pipeline doesn't use it
        const answerContainer = document.getElementById('answer');
        if (answerContainer) {
            answerContainer.style.display = 'none';
        }
    }
};
