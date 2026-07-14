import "./view.scss";
import { RenderPayload } from "../../types/ml-engine.ts";

function createTracingHelper(number: number): string {
    const digits = String(number).split('');
    
    const renderDigitSVG = (digit: string, isSingle: boolean) => {
        const width = isSingle ? 60 : 30;
        const height = 60;
        const fontSize = isSingle ? 50 : 35;
        const yPos = isSingle ? 48 : 42;
        const xPos = width / 2;
        
        let arrows = '';
        if (digit === '1') {
            arrows = `<path d="M ${xPos} ${yPos - 25} L ${xPos} ${yPos - 5} M ${xPos - 4} ${yPos - 12} L ${xPos} ${yPos - 5} L ${xPos + 4} ${yPos - 12}" stroke="#27ae60" stroke-width="1.5" fill="none"/>`;
        } else if (digit === '0') {
            arrows = `<path d="M ${xPos + 8} ${yPos - 15} A 8 10 0 1 0 ${xPos + 8} ${yPos - 14}" stroke="#27ae60" stroke-width="1.5" fill="none"/>
                      <path d="M ${xPos + 8} ${yPos - 18} L ${xPos + 8} ${yPos - 15} L ${xPos + 5} ${yPos - 15}" stroke="#27ae60" stroke-width="1.5" fill="none"/>`;
        } else if (digit === '2') {
            arrows = `<path d="M ${xPos - 8} ${yPos - 20} Q ${xPos} ${yPos - 28} ${xPos + 8} ${yPos - 20}" stroke="#27ae60" stroke-width="1.5" fill="none"/>
                      <path d="M ${xPos + 5} ${yPos - 23} L ${xPos + 8} ${yPos - 20} L ${xPos + 5} ${yPos - 17}" stroke="#27ae60" stroke-width="1.5" fill="none"/>`;
        } else if (digit === '3') {
            arrows = `<path d="M ${xPos - 8} ${yPos - 22} Q ${xPos} ${yPos - 26} ${xPos + 6} ${yPos - 20}" stroke="#27ae60" stroke-width="1.5" fill="none"/>
                      <path d="M ${xPos + 3} ${yPos - 23} L ${xPos + 6} ${yPos - 20} L ${xPos + 3} ${yPos - 17}" stroke="#27ae60" stroke-width="1.5" fill="none"/>`;
        } else if (digit === '4') {
            arrows = `<path d="M ${xPos - 6} ${yPos - 22} L ${xPos - 6} ${yPos - 12}" stroke="#27ae60" stroke-width="1.5" fill="none"/>
                      <path d="M ${xPos - 9} ${yPos - 16} L ${xPos - 6} ${yPos - 12} L ${xPos - 3} ${yPos - 16}" stroke="#27ae60" stroke-width="1.5" fill="none"/>`;
        } else if (digit === '5') {
            arrows = `<path d="M ${xPos - 6} ${yPos - 22} L ${xPos - 6} ${yPos - 16}" stroke="#27ae60" stroke-width="1.5" fill="none"/>
                      <path d="M ${xPos - 9} ${yPos - 18} L ${xPos - 6} ${yPos - 16} L ${xPos - 3} ${yPos - 16}" stroke="#27ae60" stroke-width="1.5" fill="none"/>`;
        } else if (digit === '6') {
            arrows = `<path d="M ${xPos + 6} ${yPos - 22} Q ${xPos - 6} ${yPos - 15} ${xPos - 6} ${yPos - 8}" stroke="#27ae60" stroke-width="1.5" fill="none"/>
                      <path d="M ${xPos - 9} ${yPos - 12} L ${xPos - 6} ${yPos - 8} L ${xPos - 3} ${yPos - 10}" stroke="#27ae60" stroke-width="1.5" fill="none"/>`;
        } else if (digit === '7') {
            arrows = `<path d="M ${xPos - 8} ${yPos - 25} L ${xPos + 8} ${yPos - 25}" stroke="#27ae60" stroke-width="1.5" fill="none"/>
                      <path d="M ${xPos + 5} ${yPos - 28} L ${xPos + 8} ${yPos - 25} L ${xPos + 5} ${yPos - 22}" stroke="#27ae60" stroke-width="1.5" fill="none"/>`;
        } else if (digit === '8') {
            arrows = `<path d="M ${xPos} ${yPos - 18} C ${xPos - 8} ${yPos - 25} ${xPos + 8} ${yPos - 25} ${xPos} ${yPos - 18}" stroke="#27ae60" stroke-width="1.5" fill="none"/>
                      <path d="M ${xPos - 3} ${yPos - 22} L ${xPos} ${yPos - 18} L ${xPos + 3} ${yPos - 21}" stroke="#27ae60" stroke-width="1.5" fill="none"/>`;
        } else if (digit === '9') {
            arrows = `<path d="M ${xPos + 6} ${yPos - 18} A 6 6 0 1 0 ${xPos + 6} ${yPos - 17}" stroke="#27ae60" stroke-width="1.5" fill="none"/>
                      <path d="M ${xPos + 6} ${yPos - 20} L ${xPos + 6} ${yPos - 17} L ${xPos + 3} ${yPos - 17}" stroke="#27ae60" stroke-width="1.5" fill="none"/>`;
        }

        return `
            <svg class="tracing-digit-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
                <text x="${xPos}" y="${yPos}" text-anchor="middle" font-size="${fontSize}" font-family="'Roboto Mono', monospace" font-weight="bold" fill="none" stroke="#bbb" stroke-width="2" stroke-dasharray="3 3">${digit}</text>
                ${arrows}
            </svg>
        `;
    };

    if (digits.length === 1) {
        return renderDigitSVG(digits[0], true);
    } else {
        return `
            <div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
                ${renderDigitSVG(digits[0], false)}
                ${renderDigitSVG(digits[1], false)}
            </div>
        `;
    }
}

function createDoubleTenFrameHTML(number: number) {
    const frame1 = Array.from({ length: 10 }, (_, i) => {
        const isFilled = i < number;
        const boxClass = isFilled ? 'ten-frame-box filled' : 'ten-frame-box';
        return `<div class="${boxClass}"></div>`;
    }).join('');

    const frame2 = Array.from({ length: 10 }, (_, i) => {
        const isFilled = (i + 10) < number;
        const boxClass = isFilled ? 'ten-frame-box filled' : 'ten-frame-box';
        return `<div class="${boxClass}"></div>`;
    }).join('');

    return `
        <div class="double-ten-frame">
            <div class="ten-frame">${frame1}</div>
            <div class="ten-frame">${frame2}</div>
        </div>
    `;
}

function createProblemHTML(number: number, mode: string, isSolutionView: boolean, outline: boolean) {
    const doubleTenFrameHTML = createDoubleTenFrameHTML(number);

    if (mode === 'count-objects') {
        const solutionBoxClass = isSolutionView ? 'writing-box solution' : 'writing-box';
        const boxContent = isSolutionView ? number : '';
        return `
            <div class="problem-row count-objects">
                ${doubleTenFrameHTML}
                <div class="count-input-wrapper">
                    <div class="count-label">Count:</div>
                    <div class="${solutionBoxClass}">${boxContent}</div>
                </div>
            </div>`;
    } else {
        // stroke or legacy
        const boxesHTML = Array.from({ length: 3 }, (_, i) => {
            let boxClass = 'writing-box';
            let content: string = '';

            if (i === 0) {
                // First box: tracing guide
                return `<div class="writing-box trace">${createTracingHelper(number)}</div>`;
            } else {
                if (isSolutionView) {
                    boxClass += ' solution';
                    content = String(number);
                } else {
                    if (outline) {
                        boxClass += ' outline';
                        content = String(number);
                    } else {
                        content = '';
                    }
                }
                return `<div class="${boxClass}">${content}</div>`;
            }
        }).join('');

        return `
            <div class="problem-row stroke">
                ${doubleTenFrameHTML}
                <div class="number-label">${number}</div>
                <div class="writing-boxes">${boxesHTML}</div>
            </div>`;
    }
}

window.renderView = (payload: RenderPayload) => {
    const exerciseContainer = document.getElementById('view');
    
    if (exerciseContainer) {
        const { problem, config, isSolutionView } = payload;
        const outline = config.visualParams.outline === true || config.visualParams.outline === 'true';
        const mode = problem.data.mode || 'stroke';
        
        exerciseContainer.innerHTML = createProblemHTML(problem.data.number, mode, isSolutionView, outline);

        const solutionContainer = document.getElementById('solution');
        if (solutionContainer) {
            solutionContainer.style.display = 'none';
        }
    }
};
