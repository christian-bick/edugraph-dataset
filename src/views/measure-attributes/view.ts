import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";
import { setSeed } from "../../lib/random.ts";

function getIllustrationHTML(attribute: string): string {
    if (attribute === 'height') {
        // Render a vertical tree with height indicator
        return `
            <svg width="200" height="200" viewBox="0 0 200 200" style="overflow: visible;">
                <!-- Tree Trunk -->
                <rect x="92" y="120" width="16" height="60" fill="#8b5a2b" rx="2" />
                <!-- Tree Canopy -->
                <circle cx="100" cy="90" r="45" fill="#22c55e" />
                <circle cx="75" cy="110" r="35" fill="#16a34a" />
                <circle cx="125" cy="110" r="35" fill="#16a34a" />
                <!-- Ground -->
                <line x1="20" y1="180" x2="180" y2="180" stroke="#475569" stroke-width="3" stroke-linecap="round" />
                
                <!-- Height Dimension Line -->
                <line x1="160" y1="45" x2="160" y2="180" stroke="#3b82f6" stroke-width="2.5" stroke-dasharray="4 4" />
                <!-- Arrows -->
                <path d="M 155 55 L 160 45 L 165 55" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linejoin="round" />
                <path d="M 155 170 L 160 180 L 165 170" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linejoin="round" />
                <text x="175" y="115" fill="#3b82f6" font-size="14" font-weight="bold">?</text>
            </svg>
        `;
    } else if (attribute === 'weight') {
        // Render a dial scale with a box on it
        return `
            <svg width="200" height="200" viewBox="0 0 200 200" style="overflow: visible;">
                <!-- Base -->
                <rect x="40" y="160" width="120" height="20" fill="#64748b" rx="4" />
                <!-- Scale Body -->
                <circle cx="100" cy="115" r="45" fill="#cbd5e1" stroke="#475569" stroke-width="3" />
                <!-- Dial Face -->
                <circle cx="100" cy="115" r="35" fill="#ffffff" />
                <!-- Dial ticks -->
                <line x1="100" y1="80" x2="100" y2="85" stroke="#334155" stroke-width="2" />
                <line x1="135" y1="115" x2="130" y2="115" stroke="#334155" stroke-width="2" />
                <line x1="65" y1="115" x2="70" y2="115" stroke="#334155" stroke-width="2" />
                <!-- Dial Pointer -->
                <line x1="100" y1="115" x2="120" y2="95" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
                <circle cx="100" cy="115" r="4" fill="#334155" />
                <!-- Top Tray -->
                <path d="M 60 70 L 140 70 L 120 80 L 80 80 Z" fill="#475569" />
                <line x1="100" y1="80" x2="100" y2="70" stroke="#475569" stroke-width="6" />
                <!-- Box on tray -->
                <rect x="75" y="30" width="50" height="40" fill="#ea580c" rx="3" />
                <line x1="75" y1="50" x2="125" y2="50" stroke="#c2410c" stroke-width="2" />
                <line x1="100" y1="30" x2="100" y2="70" stroke="#c2410c" stroke-width="2" />
            </svg>
        `;
    } else {
        // length
        // Render a horizontal pencil with length indicator
        return `
            <svg width="200" height="200" viewBox="0 0 200 200" style="overflow: visible;">
                <!-- Pencil Lead -->
                <polygon points="20,100 40,88 40,112" fill="#e2e8f0" />
                <polygon points="20,100 27,96 27,104" fill="#1e293b" />
                <!-- Pencil Body -->
                <rect x="40" y="88" width="110" height="24" fill="#eab308" />
                <rect x="40" y="88" width="110" height="8" fill="#ca8a04" />
                <!-- Eraser holder -->
                <rect x="150" y="88" width="15" height="24" fill="#94a3b8" />
                <!-- Eraser -->
                <path d="M 165 88 L 173 88 A 12 12 0 0 1 173 112 L 165 112 Z" fill="#fda4af" />
                
                <!-- Length Dimension Line -->
                <line x1="20" y1="140" x2="175" y2="140" stroke="#3b82f6" stroke-width="2.5" stroke-dasharray="4 4" />
                <!-- Arrows -->
                <path d="M 30 135 L 20 140 L 30 145" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linejoin="round" />
                <path d="M 165 135 L 175 140 L 165 145" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linejoin="round" />
                <text x="95" y="165" fill="#3b82f6" font-size="14" font-weight="bold" text-anchor="middle">?</text>
            </svg>
        `;
    }
}

function createProblemHTML(payload: RenderPayload) {
    const { problem, isSolutionView } = payload;
    const attribute = problem.data.attribute || 'length';

    const promptText = `What are we measuring with this setup?`;
    
    const correctOption = attribute; // 'length', 'height', 'weight'
    
    const btnLengthClass = (correctOption === 'length' && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
    const btnHeightClass = (correctOption === 'height' && isSolutionView) ? 'choice-btn correct' : 'choice-btn';
    const btnWeightClass = (correctOption === 'weight' && isSolutionView) ? 'choice-btn correct' : 'choice-btn';

    return `
        <div class="problem-container">
            <div class="prompt-text">${promptText}</div>
            
            <div class="workspace-area">
                ${getIllustrationHTML(attribute)}
            </div>

            <div class="choices-container">
                <div class="${btnLengthClass}">Length</div>
                <div class="${btnHeightClass}">Height</div>
                <div class="${btnWeightClass}">Weight</div>
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
