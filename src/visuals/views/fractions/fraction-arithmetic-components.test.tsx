import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {
    EquationPanel,
    FractionArithmeticText,
    FractionModelDiagram
} from './fraction-arithmetic-components.tsx';

describe('fraction arithmetic typography', () => {
    it('renders every mixed number as a nonbreaking whole/fraction pair with visible spacing', () => {
        const markup = renderToStaticMarkup(
            <FractionArithmeticText text="1 2/4 + 1 1/3 = 2 7/12" />
        );

        expect(markup.match(/gap-\[0\.5em\]/g)).toHaveLength(3);
        expect(markup.match(/whitespace-nowrap/g)).toHaveLength(3);
        expect(markup).toContain('<span class="sr-only">1 2/4</span>');
        expect(markup).toContain('<span class="sr-only">1 1/3</span>');
        expect(markup).toContain('<span class="sr-only">2 7/12</span>');
    });

    it('uses the mixed-number formatter in model badges, legends, and equations', () => {
        const markup = renderToStaticMarkup(
            <>
                <FractionModelDiagram
                    model={{
                        denominator: 4,
                        display: '1 2/4',
                        totalNumerator: 6,
                        frameCount: 2,
                        groups: [{
                            id: 'result',
                            role: 'result',
                            label: '1 2/4',
                            startPart: 0,
                            partCount: 6
                        }],
                        frames: [0, 1].map(frameIndex => ({
                            frameIndex,
                            cells: Array.from({length: 4}, (_, cellIndex) => ({
                                partIndex: frameIndex * 4 + cellIndex,
                                groupId: frameIndex * 4 + cellIndex < 6 ? 'result' : null
                            }))
                        }))
                    }}
                    title="Result"
                    ariaLabel="The result is 1 2/4."
                />
                <EquationPanel equation="2 1/4 − 1 2/4 = 3/4" solved />
            </>
        );

        expect(markup.match(/gap-\[0\.5em\]/g)).toHaveLength(4);
        expect(markup).toContain('aria-label="The result is 1 2/4."');
    });
});
