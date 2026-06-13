import { random } from "../../lib/random.ts";
export interface Problem {
    num1: number;
    num2: number;
    answer: number;
    symbol?: string;
}

function createProblemHTML(problem: Problem, highlightKey = '') {
    const isHighlighted = (key: string) => key === highlightKey ? 'highlight' : '';

    return `
        <div class="problem">
            <div class="box ${isHighlighted('num1')}">${problem.num1}</div>
            <div class="symbol ${isHighlighted('symbol')}">${problem.symbol}</div>
            <div class="box ${isHighlighted('num2')}">${problem.num2}</div>
            <div class="symbol">=</div>
            <div class="box answer-box ${isHighlighted('answer')}">${problem.answer}</div>
        </div>`;
}

export function renderContent(config, problemSet: Problem[]) {

// --- DOM ELEMENTS ---
    const problemsContainer = document.getElementById('problems-container');
    const answersContainer = document.getElementById('answers-container');

    if (problemsContainer && answersContainer) {
        for (const [index, problem] of problemSet.entries()) {
            const worksheetProblem: Problem = { ...problem };
            let blankPartKey = '';

            // Determine the blank part
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

            // For all problems except the first one, blank out the determined part.
            if (index > 0) {
                if (blankPartKey === 'symbol') {
                    worksheetProblem.symbol = '';
                } else {
                    (worksheetProblem as any)[blankPartKey] = '';
                }
            }

            const problemHTML = createProblemHTML(worksheetProblem, index === 0 ? blankPartKey : '');
            const answerHTML = createProblemHTML(problem, blankPartKey);

            problemsContainer.innerHTML += problemHTML;
            answersContainer.innerHTML += answerHTML;
        }
    }
}
