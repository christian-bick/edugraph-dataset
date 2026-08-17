import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FractionArithmeticGenerator} from '../../../generators/fraction/fraction-arithmetic/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {
    EquationPanel,
    FractionArithmeticText,
    FractionArithmeticWork,
    FractionModelDiagram
} from './fraction-arithmetic-components.tsx';

const generator = new FractionArithmeticGenerator();

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
                    presentation="legacy-local"
                />
                <EquationPanel equation="2 1/4 − 1 2/4 = 3/4" solved />
            </>
        );

        expect(markup.match(/gap-\[0\.5em\]/g)).toHaveLength(4);
        expect(markup).toContain('aria-label="The result is 1 2/4."');
    });

    it('withholds the unit-fraction multiplier and copy count in Question mode', () => {
        setSeed('unit-multiple-component');
        const data = generator.generate({
            task: 'unit-fraction-multiple',
            usesCommonDenominator: false,
            operation: 'multiplication'
        }).data;
        if (data.task !== 'unit-fraction-multiple') throw new Error('Expected unit multiple.');

        const question = renderToStaticMarkup(
            <FractionArithmeticWork data={data} isSolutionView={false} />
        );
        const solution = renderToStaticMarkup(
            <FractionArithmeticWork data={data} isSolutionView />
        );

        expect(question).toContain(data.questionEquation);
        expect(question).toContain('Given fraction');
        expect(question).toContain('Given amount:');
        expect(question).not.toContain('Group A:');
        expect(question).not.toMatch(/[A-D] · \d+\/\d+/);
        expect(question).not.toContain('Copy 1 of');
        expect(question).not.toContain(data.answerStatement);
        expect(question).not.toContain(data.solutionEquation);
        expect(solution).toContain(data.solutionEquation);
        expect(solution).toContain('Combined product');
        expect(solution).toContain('Group A:');
        expect(solution).toContain('Group B:');
    });

    it('keeps separate known groups in Question mode and reveals only the supplied aggregate in Solution mode', () => {
        setSeed('fraction-product-component');
        const data = generator.generate({
            task: 'whole-number-fraction-product-improper',
            usesCommonDenominator: false,
            operation: 'multiplication'
        }).data;
        if (data.task !== 'whole-number-fraction-product') throw new Error('Expected fraction product.');

        const question = renderToStaticMarkup(
            <FractionArithmeticWork data={data} isSolutionView={false} />
        );
        const solution = renderToStaticMarkup(
            <FractionArithmeticWork data={data} isSolutionView />
        );

        expect(question.match(/Copy \d of \d/g)).toHaveLength(data.groupCount);
        for (let index = 0; index < data.groupCount; index += 1) {
            expect(question).toContain(`Group ${String.fromCharCode(65 + index)}:`);
        }
        expect(question).not.toMatch(/[A-D] · \d+\/\d+/);
        expect(question).toContain(data.questionEquation);
        expect(question).not.toContain(data.equationChain);
        expect(question).not.toContain('Combined product');
        expect(solution).toContain(data.fractionAsUnitMultipleEquation);
        expect(solution).toContain(data.iteratedUnitEquation);
        expect(solution).toContain(data.equationChain);
        expect(solution).toContain('Combined product');
    });

    it('corrects only the legacy binary token identity while retaining its legend layout', () => {
        setSeed('legacy-group-token-coherence');
        const data = generator.generate({
            task: 'interpret-operation',
            usesCommonDenominator: true,
            operation: 'addition'
        }).data;
        if (data.task !== 'interpret-operation') throw new Error('Expected interpretation.');

        const first = renderToStaticMarkup(
            <FractionModelDiagram
                model={data.questionModels[0]}
                title="First"
                ariaLabel="First given amount"
                presentation="legacy-stable"
            />
        );
        const second = renderToStaticMarkup(
            <FractionModelDiagram
                model={data.questionModels[1]}
                title="Second"
                ariaLabel="Second given amount"
                presentation="legacy-stable"
            />
        );
        const solution = renderToStaticMarkup(
            <FractionArithmeticWork data={data} isSolutionView />
        );

        expect(first).toContain('A · ');
        expect(first).not.toContain('B · ');
        expect(second).toContain('B · ');
        expect(second).not.toContain('A · ');
        expect(solution).toContain('A · ');
        expect(solution).toContain('B · ');
        expect(solution).not.toContain('Group A:');
    });

    it('preserves legacy-local dot legends for decompose and mixed-operation SSR', () => {
        setSeed('legacy-decompose-presentation');
        const decomposition = generator.generate({
            task: 'decompose-proper',
            usesCommonDenominator: true,
            operation: 'addition'
        }).data;
        if (decomposition.task !== 'decompose') throw new Error('Expected decomposition.');

        setSeed('legacy-mixed-presentation');
        const mixed = generator.generate({
            task: 'mixed-operation',
            usesCommonDenominator: true,
            operation: 'addition'
        }).data;
        if (mixed.task !== 'mixed-operation') throw new Error('Expected mixed operation.');

        const decompositionMarkup = renderToStaticMarkup(
            <FractionArithmeticWork data={decomposition} isSolutionView />
        );
        const mixedMarkup = renderToStaticMarkup(
            <FractionArithmeticWork data={mixed} isSolutionView />
        );

        expect(decompositionMarkup).toContain('A · ');
        expect(decompositionMarkup).toContain('B · ');
        expect(decompositionMarkup).not.toContain('Group A:');
        expect(mixedMarkup.match(/A · /g)!.length).toBeGreaterThanOrEqual(3);
        expect(mixedMarkup).not.toContain('B · ');
        expect(mixedMarkup).not.toContain('Group A:');
        expect(mixedMarkup).not.toContain('Given amount:');
    });
});
