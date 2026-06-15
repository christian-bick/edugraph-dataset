import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";

function createProblemHTML(data: { num1: number, num2: number, answer: string }, isSolutionView: boolean) {
    return `
        <div class="problem">
            <span class="number">${data.num1}</span>
            <span class="solution-box ${isSolutionView ? 'solution' : ''}">${isSolutionView ? data.answer : ''}</span>
            <span class="number">${data.num2}</span>
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
