import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";

function createProblemHTML(number: number, isSolutionView: boolean, outline: boolean) {
    const boxesHTML = Array.from({ length: 3 }, (_, i) => {
        let boxClass = 'writing-box';
        let content: number | string = '';

        if (isSolutionView) {
            boxClass += ' solution';
            content = number;
        } else {
            if (outline) {
                boxClass += ' outline';
                content = number;
            } else {
                content = '';
            }
        }
        return `<div class="${boxClass}">${content}</div>`;
    }).join('');

    const tenFrameHTML = `
        <div class="ten-frame">
            ${Array.from({ length: 10 }, (_, i) => {
                const isFilled = i < number;
                const boxClass = isFilled ? 'ten-frame-box filled' : 'ten-frame-box';
                return `<div class="${boxClass}"></div>`;
            }).join('')}
        </div>`;

    return `
        <div class="problem-row">
            ${tenFrameHTML}
            <div class="number-label">${number}</div>
            <div class="writing-boxes">${boxesHTML}</div>
        </div>`;
}

window.renderView = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('view');
    
    if (exerciseContainer) {
        const { problem, config, isSolutionView } = payload;
        const outline = config.visualParams.outline === true || config.visualParams.outline === 'true';
        
        exerciseContainer.innerHTML = createProblemHTML(problem.data.number, isSolutionView, outline);

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
