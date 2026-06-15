import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";
import { random } from "../../lib/random.ts";

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

function createProblemHTML(numObjects: number, icon: string, showAnswer: boolean) {
    const objectsHTML = Array(numObjects).fill(`<img src="/icons/counting/${icon}" alt="counting object">`).join('');
    return `
        <div class="problem">
            <div class="objects-container">${objectsHTML}</div>
            <div class="solution-box">${showAnswer ? numObjects : ''}</div>
        </div>`;
}

window.renderView = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('view');
    
    if (exerciseContainer) {
        const { problem, isSolutionView } = payload;
        
        // We pick an icon pseudo-randomly based on the problem id so it stays consistent between Q and A views,
        // or we can just pick one deterministically. Let's use the problem ID to derive an index.
        const iconIndex = Array.from(problem.id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % ICONS.length;
        const icon = ICONS[iconIndex];
        
        exerciseContainer.innerHTML = createProblemHTML(problem.data.numObjects, icon, isSolutionView);

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
