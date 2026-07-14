import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";
import { setSeed } from "../../lib/random.ts";

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

function createProblemHTML(number: number, icon: string, isSolutionView: boolean) {
    // Generate Row 1 (close together)
    const closeSpacing = 30;
    const closeStartX = 200 - ((number - 1) * closeSpacing) / 2;
    const rowAHTML = Array.from({ length: number }, (_, i) => {
        const x = closeStartX + i * closeSpacing;
        return `<img src="/icons/counting/${icon}" style="left: ${x}px;" alt="object A">`;
    }).join('');

    // Generate Row 2 (spread out)
    const farSpacing = 50;
    const farStartX = 200 - ((number - 1) * farSpacing) / 2;
    const rowBHTML = Array.from({ length: number }, (_, i) => {
        const x = farStartX + i * farSpacing;
        return `<img src="/icons/counting/${icon}" style="left: ${x}px;" alt="object B">`;
    }).join('');

    // Buttons
    const sameBtnClass = isSolutionView ? "choice-btn correct" : "choice-btn";
    const btnAClass = "choice-btn";
    const btnBClass = "choice-btn";

    return `
        <div class="problem-container">
            <div class="prompt-text">Are there more items in Group A, Group B, or are they the same?</div>
            
            <div class="comparison-area">
                <div class="group-row">
                    <span class="group-label">Group A:</span>
                    <div class="items-row close">
                        ${rowAHTML}
                    </div>
                </div>
                <div class="group-row">
                    <span class="group-label">Group B:</span>
                    <div class="items-row far">
                        ${rowBHTML}
                    </div>
                </div>
            </div>

            <div class="choices-container">
                <div class="${btnAClass}">Group A has more</div>
                <div class="${btnBClass}">Group B has more</div>
                <div class="${sameBtnClass}">They are the same</div>
            </div>
        </div>
    `;
}

window.renderView = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('view');
    
    if (exerciseContainer) {
        const { problem, isSolutionView } = payload;
        const number = problem.data.numObjects || 6;
        
        // Seed randomness deterministically
        setSeed(problem.id);

        const iconIndex = Array.from(problem.id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % ICONS.length;
        const icon = ICONS[iconIndex];
        
        exerciseContainer.innerHTML = createProblemHTML(number, icon, isSolutionView);

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
