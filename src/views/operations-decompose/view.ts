import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";
import { setSeed } from "../../lib/random.ts";

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

function renderDotsGroupHTML(a: number, b: number, icon: string) {
    const spacing = 18;
    const total = a + b;
    const startX = 100 - ((total - 1) * spacing) / 2;

    let html = '';
    // color a dots (rose)
    for (let i = 0; i < a; i++) {
        const x = startX + i * spacing - 7.5;
        html += `<div class="dot color-a" style="left: ${x}px;"><img src="/icons/counting/${icon}" alt="part 1 dot"></div>`;
    }
    // color b dots (amber)
    for (let i = 0; i < b; i++) {
        const x = startX + (a + i) * spacing - 7.5;
        html += `<div class="dot color-b" style="left: ${x}px;"><img src="/icons/counting/${icon}" alt="part 2 dot"></div>`;
    }
    return html;
}

function createProblemHTML(payload: RenderPayload, icon: string) {
    const { problem, isSolutionView } = payload;
    
    // Fallbacks
    const targetNumber = problem.data.targetNumber !== undefined ? problem.data.targetNumber : 6;
    let pair1 = problem.data.pair1 || [2, 4];
    let pair2 = problem.data.pair2 || [1, 5];

    if (!problem.data.pair1 && problem.data.num1 !== undefined && problem.data.num2 !== undefined) {
        const n1 = problem.data.num1;
        const n2 = problem.data.num2;
        pair1 = [n1, n2];
        pair2 = n1 > 1 ? [n1 - 1, n2 + 1] : [n1, n2];
    }

    const box1_p1 = isSolutionView ? pair1[0] : '';
    const box2_p1 = isSolutionView ? pair1[1] : '';
    const box1_p2 = isSolutionView ? pair2[0] : '';
    const box2_p2 = isSolutionView ? pair2[1] : '';
    const solClass = isSolutionView ? 'solution' : '';

    return `
        <div class="problem-container">
            <div class="prompt-text">Decompose ${targetNumber} in two different ways.</div>
            
            <div class="decompose-tree">
                <!-- Target node at the top -->
                <div class="target-node">${targetNumber}</div>
                
                <div class="branches">
                    <!-- Branch 1 -->
                    <div class="branch-card">
                        <div class="dots-display">
                            ${renderDotsGroupHTML(pair1[0], pair1[1], icon)}
                        </div>
                        <div class="equation-row">
                            <span class="eq-text">${targetNumber} = </span>
                            <div class="input-box ${solClass}">${box1_p1}</div>
                            <span class="eq-text">+</span>
                            <div class="input-box ${solClass}">${box2_p1}</div>
                        </div>
                    </div>

                    <!-- Branch 2 -->
                    <div class="branch-card">
                        <div class="dots-display">
                            ${renderDotsGroupHTML(pair2[0], pair2[1], icon)}
                        </div>
                        <div class="equation-row">
                            <span class="eq-text">${targetNumber} = </span>
                            <div class="input-box ${solClass}">${box1_p2}</div>
                            <span class="eq-text">+</span>
                            <div class="input-box ${solClass}">${box2_p2}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.renderView = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('view');
    
    if (exerciseContainer) {
        const { problem } = payload;
        
        // Seed randomness deterministically
        setSeed(problem.id);

        const iconIndex = Array.from(problem.id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % ICONS.length;
        const icon = ICONS[iconIndex];
        
        exerciseContainer.innerHTML = createProblemHTML(payload, icon);

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
