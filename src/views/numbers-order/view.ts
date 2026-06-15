import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";

function createProblemHTML(numbers: number[], isDesc: boolean, isSolutionView: boolean) {
    const unorderedNumbersHTML = numbers.map(n => `<div class="number-box">${n}</div>`).join('');
    const sortedNumbers = [...numbers].sort((a, b) => isDesc ? b - a : a - b);

    const orderedBoxesHTML = sortedNumbers.map((n) => {
        return `<div class="writing-box ${isSolutionView ? 'solution' : ''}">${isSolutionView ? n : ''}</div>`;
    }).join('');

    const arrowSymbol = isDesc ? '↘' : '↗';

    return `
        <div class="problem-row">
            <div class="unordered-numbers">${unorderedNumbersHTML}</div>
            <div class="arrow">${arrowSymbol}</div>
            <div class="writing-boxes">${orderedBoxesHTML}</div>
        </div>`;
}

window.renderView = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('view');
    
    if (exerciseContainer) {
        const { problem, config, isSolutionView } = payload;
        const isDesc = config.visualParams.desc === true || config.visualParams.desc === 'true';
        
        exerciseContainer.innerHTML = createProblemHTML(problem.data.numbers, isDesc, isSolutionView);

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
