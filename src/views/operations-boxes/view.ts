import { random, setSeed } from "../../lib/random.ts";
import "./view.scss";
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
    isSolutionView: boolean
) {
    const blankPart = visualParams.blankPart || 'solution';
    const symbol = operatorSymbols[data.operator] || '?';
    
    const displayProblem: any = { 
        num1: data.num1, 
        num2: data.num2, 
        solution: data.answer,
        symbol: symbol
    };

    if (!isSolutionView) {
        if (blankPart === 'symbol') {
            displayProblem.symbol = '';
        } else {
            displayProblem[blankPart] = '';
        }
    }

    const getClass = (partName: string, baseClass: string) => {
        let cls = baseClass;
        if (isSolutionView && blankPart === partName) {
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
            <div class="${getClass('solution', 'box solution-box')}">${displayProblem.solution}</div>
        </div>`;
}

window.renderView = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('view');
    
    if (exerciseContainer) {
        const { problem, config, isSolutionView } = payload;
        
        // --- Deterministic Blank Selection ---
        // We seed with the problem ID so Q and A always pick the same part to blank
        setSeed(problem.id);
        
        let blankPartKey = '';
        const requestedBlank = config.visualParams.blankPart || 'solution';
        
        switch (requestedBlank) {
            case 'problem': {
                const parts = ['num1', 'num2'];
                blankPartKey = parts[Math.floor(random() * parts.length)];
                break;
            }
            case 'problem-answer': {
                const parts = ['num1', 'num2', 'solution'];
                blankPartKey = parts[Math.floor(random() * parts.length)];
                break;
            }
            case 'operator':
                blankPartKey = 'symbol';
                break;
            case 'random': {
                const allParts = ['num1', 'num2', 'solution', 'symbol'];
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
            isSolutionView
        );

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
