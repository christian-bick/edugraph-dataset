import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";
import { setSeed } from "../../lib/random.ts";

function getIllustrationHTML(attribute: string, val1: number, val2: number): string {
    if (attribute === 'weight') {
        // Render a balance scale tilted left or right
        const leftHeavier = val1 > val2;
        
        // Tilt angles
        const beamRotate = leftHeavier ? 15 : -15;
        const leftPanY = leftHeavier ? 115 : 65;
        const rightPanY = leftHeavier ? 65 : 115;

        return `
            <svg width="220" height="200" viewBox="0 0 220 200" style="overflow: visible;">
                <!-- Scale Base & Pillar -->
                <rect x="100" y="140" width="20" height="40" fill="#64748b" />
                <rect x="70" y="170" width="80" height="15" fill="#475569" rx="3" />
                <circle cx="110" cy="90" r="6" fill="#334155" />
                
                <!-- Rotating Beam -->
                <g style="transform-origin: 110px 90px; transform: rotate(${beamRotate}deg); transition: transform 0.5s;">
                    <line x1="30" y1="90" x2="190" y2="90" stroke="#475569" stroke-width="5" />
                    <!-- Left Hanger -->
                    <line x1="30" y1="90" x2="30" y2="${leftPanY - 20}" stroke="#94a3b8" stroke-width="2" />
                    <line x1="30" y1="90" x2="15" y2="${leftPanY}" stroke="#94a3b8" stroke-width="1.5" />
                    <line x1="30" y1="90" x2="45" y2="${leftPanY}" stroke="#94a3b8" stroke-width="1.5" />
                    <path d="M 10 ${leftPanY} L 50 ${leftPanY}" stroke="#475569" stroke-width="3" stroke-linecap="round" />
                    
                    <!-- Right Hanger -->
                    <line x1="190" y1="90" x2="190" y2="${rightPanY - 20}" stroke="#94a3b8" stroke-width="2" />
                    <line x1="190" y1="90" x2="175" y2="${rightPanY}" stroke="#94a3b8" stroke-width="1.5" />
                    <line x1="190" y1="90" x2="205" y2="${rightPanY}" stroke="#94a3b8" stroke-width="1.5" />
                    <path d="M 170 ${rightPanY} L 210 ${rightPanY}" stroke="#475569" stroke-width="3" stroke-linecap="round" />
                </g>

                <!-- Left Object (Static overlay or attached to pans. Let's place it at static positions matching the pans) -->
                <!-- Left Pan Center: 30, leftPanY. Let's put a box there. -->
                <rect x="15" y="${leftPanY - 25}" width="30" height="25" fill="#ef4444" rx="2" />
                <text x="30" y="${leftPanY - 8}" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">A</text>

                <!-- Right Object. Right Pan Center: 190, rightPanY. Let's put a smaller/larger circle. -->
                <circle cx="190" cy="${rightPanY - 15}" r="15" fill="#3b82f6" />
                <text x="190" y="${rightPanY - 11}" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">B</text>
            </svg>
        `;
    } else {
        // length
        // Render two horizontal ribbons side-by-side aligned left
        const widthA = val1 * 25;
        const widthB = val2 * 25;
        
        return `
            <div class="length-comparison">
                <div class="ribbon-container">
                    <span class="ribbon-label">A:</span>
                    <div class="ribbon ribbon-a" style="width: ${widthA}px;"></div>
                </div>
                <div class="ribbon-container">
                    <span class="ribbon-label">B:</span>
                    <div class="ribbon ribbon-b" style="width: ${widthB}px;"></div>
                </div>
            </div>
        `;
    }
}

function createProblemHTML(payload: RenderPayload) {
    const { problem, isSolutionView } = payload;
    const attribute = problem.data.attribute || 'length';
    const relation = problem.data.relation || 'longer';
    const val1 = problem.data.val1 !== undefined ? problem.data.val1 : 8;
    const val2 = problem.data.val2 !== undefined ? problem.data.val2 : 4;
    const answer = problem.data.answer || 'A';

    const promptText = attribute === 'length' 
        ? `Which ribbon is ${relation}?` 
        : `Which item is ${relation}?`;

    const labelA = attribute === 'length' ? 'Ribbon A' : 'Item A';
    const labelB = attribute === 'length' ? 'Ribbon B' : 'Item B';

    const btnAClass = (answer === 'A' && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
    const btnBClass = (answer === 'B' && isSolutionView) ? 'choice-btn correct' : 'choice-btn';

    return `
        <div class="problem-container">
            <div class="prompt-text">${promptText}</div>
            
            <div class="workspace-area">
                ${getIllustrationHTML(attribute, val1, val2)}
            </div>

            <div class="choices-container">
                <div class="${btnAClass}">${labelA}</div>
                <div class="${btnBClass}">${labelB}</div>
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

        exerciseContainer.innerHTML = createProblemHTML(payload);

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
