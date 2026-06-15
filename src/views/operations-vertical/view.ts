import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";

const operatorSymbols: { [key: string]: string } = {
    add: '+',
    subtract: '−',
    multiply: '×',
    divide: '÷'
};

function createProblemHTML(
    data: { num1: number, num2: number, answer: number, operator: string },
    isSolutionView: boolean
) {
    const symbol = operatorSymbols[data.operator] || '?';

    return `
        <div class="problem">
            <span class="number">${data.num1}</span>
            <span class="number">
                <span class="operator">${symbol}</span>${data.num2}
            </span>
            <div class="line"></div>
            <div class="solution-box ${isSolutionView ? 'solution' : ''}">${isSolutionView ? data.answer : ''}</div>
        </div>`;
}

window.renderView = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('view');
    
    if (exerciseContainer) {
        const { problem, isSolutionView } = payload;
        
        exerciseContainer.innerHTML = createProblemHTML(problem.data as any, isSolutionView);

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
