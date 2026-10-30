import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionQuotientModelGenerator} from '../../../generators/fraction/fraction-quotient-model/generator.ts';
import {FractionQuotientBody} from './fraction-quotient-view.tsx';
import {formatQuotientValue} from './fraction-quotient-helpers.ts';

const generator = new FractionQuotientModelGenerator();
const sample = (relationProfile: Parameters<FractionQuotientModelGenerator['generate']>[0]['relationProfile']) => {
    setSeed(`quotient-render-${relationProfile}`);
    return generator.generate({relationProfile, numericProfile: relationProfile === 'fraction-as-quotient'
        ? 'proper' : 'nonzero'}).data;
};
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('fraction quotient task projections', () => {
    it('distinguishes the original zero-dividend Equation collision from basic and inverse execution', () => {
        setSeed(39726493);
        const basic = generator.generate({relationProfile: 'unit-divisor-basic', numericProfile: 'zero'}).data;
        setSeed(1130970508);
        const equation = generator.generate({relationProfile: 'unit-divisor-equation', numericProfile: 'zero'}).data;
        const {equationWitness, ...withoutEquation} = equation;
        expect(equationWitness).toBeDefined();
        expect(withoutEquation).toEqual(basic);
        expect(equation.dividend).toEqual({numerator: 0, denominator: 1});
        expect(equation.divisor).toEqual({numerator: 1, denominator: 3});

        setSeed(1130970508);
        const inverse = generator.generate({relationProfile: 'unit-divisor-inverse', numericProfile: 'zero'}).data;
        for (const isSolutionView of [false, true]) {
            const render = (data: typeof equation) => renderToStaticMarkup(
                <FractionQuotientBody data={data} task="division-execution" isSolutionView={isSolutionView} />);
            const [basicMarkup, equationMarkup, inverseMarkup] = [basic, equation, inverse].map(render);
            expect(new Set([basicMarkup, equationMarkup, inverseMarkup]).size).toBe(3);
            expect(equationMarkup).toContain('data-evidence="execution-equation"');
            expect(visible(equationMarkup)).toContain('Group count × length per group = total length');
            expect(visible(equationMarkup)).toContain(isSolutionView ? '0 × 1/3 m = 0 m' : '______ × 1/3 m = 0 m');
            expect(basicMarkup).not.toContain('data-evidence="execution-equation"');
            expect(inverseMarkup).not.toContain('data-evidence="execution-equation"');
            expect(inverseMarkup).toContain('data-evidence="execution-multiplication-check"');
            if (isSolutionView) {
                expect(equationMarkup).toMatch(/text-emerald-950[^>]*>[\s\S]*data-evidence="execution-equation"/);
            } else {
                expect(equationMarkup).not.toContain('emerald');
                expect(visible(equationMarkup)).not.toMatch(/0 pieces|0 groups|0 ×/);
            }
        }
    });

    it('projects canonical equation quantities and withholds the quotient factor for grouping and sharing', () => {
        for (const relationProfile of ['whole-sharing-equation', 'unit-dividend-equation', 'unit-divisor-equation'] as const) {
            for (let seed = 0; seed < 6; seed++) {
                setSeed(`execution-equation-${relationProfile}-${seed}`);
                const data = generator.generate({relationProfile, numericProfile: 'nonzero'}).data;
                const witness = data.equationWitness!;
                const groupCount = formatQuotientValue(witness.groupCount);
                const perGroup = formatQuotientValue(witness.measurePerGroup);
                const total = formatQuotientValue(witness.totalMeasure);
                const question = renderToStaticMarkup(<FractionQuotientBody data={data} task="division-execution" isSolutionView={false} />);
                const solution = renderToStaticMarkup(<FractionQuotientBody data={data} task="division-execution" isSolutionView />);
                const questionEquation = data.orientation === 'whole-by-unit-fraction'
                    ? `______ × ${perGroup} m = ${total} m`
                    : `${groupCount} × ______ m = ${total} m`;
                expect(visible(question)).toContain(questionEquation);
                expect(visible(solution)).toContain(`${groupCount} × ${perGroup} m = ${total} m`);
                expect(question).not.toContain('emerald');
                expect(solution).toMatch(/text-emerald-950[^>]*>[\s\S]*data-evidence="execution-equation"/);
            }
        }
    });

    it('keeps Equation projection out of other tasks and out of non-Equation execution', () => {
        const equation = sample('unit-dividend-equation');
        const {equationWitness: _witness, ...basic} = equation;
        for (const task of ['quotient-interpretation', 'division-interpretation', 'division-story-creation',
            'division-inverse-explanation', 'division-word-problem'] as const) {
            for (const isSolutionView of [false, true]) {
                const markup = renderToStaticMarkup(<FractionQuotientBody data={equation} task={task} isSolutionView={isSolutionView} />);
                expect(markup).not.toContain('data-evidence="execution-equation"');
                if (task !== 'division-word-problem') {
                    const control = renderToStaticMarkup(<FractionQuotientBody data={basic} task={task} isSolutionView={isSolutionView} />);
                    expect(markup).toBe(control);
                }
            }
        }
        for (const relationProfile of ['unit-dividend-basic', 'unit-divisor-basic',
            'unit-dividend-inverse', 'unit-divisor-inverse', 'fraction-as-quotient'] as const) {
            const data = sample(relationProfile);
            for (const isSolutionView of [false, true]) {
                const markup = renderToStaticMarkup(<FractionQuotientBody data={data} task="division-execution" isSolutionView={isSolutionView} />);
                expect(markup).not.toContain('data-evidence="execution-equation"');
                expect(visible(markup)).not.toContain('Group count × length per group = total length');
            }
        }
    });

    it('replays the zero-dividend failure with an empty amount and a separate correct partition reference', () => {
        setSeed(1130970508);
        const data = generator.generate({relationProfile: 'unit-divisor-inverse', numericProfile: 'zero'}).data;
        expect(data.orientation).toBe('whole-by-unit-fraction');
        expect(data.dividend).toEqual({numerator: 0, denominator: 1});
        expect(data.divisor).toEqual({numerator: 1, denominator: 3});
        const question = renderToStaticMarkup(<FractionQuotientBody data={data} task="division-execution" isSolutionView={false} />);
        const solution = renderToStaticMarkup(<FractionQuotientBody data={data} task="division-execution" isSolutionView />);
        expect(visible(question)).toContain('Dividend: 0 meters');
        expect(visible(question)).toContain('Empty dividend');
        expect(visible(question)).toContain('One-meter partition reference');
        expect(question.match(/>1\/3 m<\/text>/g)).toHaveLength(3);
        expect(visible(question)).toContain('______ × 1/3 = 0');
        expect(question).not.toContain('emerald');
        expect(visible(question)).not.toMatch(/0 pieces|0 groups|0 ×/);
        expect(visible(solution)).toContain('0 × 1/3 = 0/3 = 0');
        expect(solution).toMatch(/text-emerald-950[^>]*>[\s\S]*data-evidence="execution-multiplication-check"/);
    });

    it('shows selected multiplication evidence for nonzero unit-dividend and unit-divisor execution', () => {
        for (const relationProfile of ['unit-dividend-inverse', 'unit-divisor-inverse'] as const) {
            const data = sample(relationProfile);
            const question = renderToStaticMarkup(<FractionQuotientBody data={data} task="division-execution" isSolutionView={false} />);
            const solution = renderToStaticMarkup(<FractionQuotientBody data={data} task="division-execution" isSolutionView />);
            expect(question).toContain('data-evidence="execution-multiplication-check"');
            expect(visible(question)).toMatch(/______ × .* = /);
            expect(solution).toContain('data-evidence="execution-multiplication-check"');
            expect(visible(solution)).toContain(`${data.multiplicationWitness!.unreducedProduct.numerator}/${data.multiplicationWitness!.unreducedProduct.denominator}`);
        }
        const basic = sample('unit-dividend-basic');
        for (const isSolutionView of [false, true]) {
            const markup = renderToStaticMarkup(<FractionQuotientBody data={basic} task="division-execution" isSolutionView={isSolutionView} />);
            expect(markup).not.toContain('data-evidence="execution-multiplication-check"');
            expect(markup).not.toContain('One-meter partition reference');
        }
    });

    it('keeps the zero-reference and execution check changes out of other legacy task identities', () => {
        setSeed(1130970508);
        const data = generator.generate({relationProfile: 'unit-divisor-inverse', numericProfile: 'zero'}).data;
        for (const task of ['division-interpretation', 'division-story-creation', 'division-inverse-explanation', 'division-word-problem'] as const) {
            const markup = renderToStaticMarkup(<FractionQuotientBody data={data} task={task} isSolutionView />);
            expect(markup).not.toContain('One-meter partition reference');
            expect(markup).not.toContain('data-evidence="execution-multiplication-check"');
            expect(visible(markup)).toContain('0 meters: no unit parts to count');
        }
    });

    it('keeps execution result blank in Q and relates answer to partition in S', () => {
        for (const relationProfile of ['whole-sharing-equation', 'unit-dividend-basic', 'unit-divisor-basic'] as const) {
            const data = sample(relationProfile);
            const q = visible(renderToStaticMarkup(<FractionQuotientBody data={data} task="division-execution" isSolutionView={false} />));
            const s = visible(renderToStaticMarkup(<FractionQuotientBody data={data} task="division-execution" isSolutionView />));
            expect(q).toContain('= ______');
            expect(s).toContain('equal');
            if (data.orientation === 'whole-by-whole') {
                expect(s).toContain(`${data.quotient.numerator}/${data.quotient.denominator}`);
            }
        }
    });

    it('keeps story creation, interpretation, and inverse reasoning distinct', () => {
        const data = sample('unit-dividend-inverse');
        const storyQ = visible(renderToStaticMarkup(<FractionQuotientBody data={data} task="division-story-creation" isSolutionView={false} />));
        const storyS = visible(renderToStaticMarkup(<FractionQuotientBody data={data} task="division-story-creation" isSolutionView />));
        expect(storyQ).toContain('My story:');
        expect(storyQ).toContain('= ______');
        expect(storyQ).not.toContain('Example story:');
        expect(storyS).toContain('Example story:');
        expect(storyS).toContain('person');
        expect(storyS).not.toContain('= ______');

        const meaningQ = visible(renderToStaticMarkup(<FractionQuotientBody data={data} task="division-interpretation" isSolutionView={false} />));
        const meaningS = visible(renderToStaticMarkup(<FractionQuotientBody data={data} task="division-interpretation" isSolutionView />));
        expect(meaningQ).toContain('The quotient measures or counts ____________________');
        expect(meaningQ).toContain('= ______');
        expect(meaningS).toContain('each person gets one');
        expect(meaningS).not.toContain('= ______');

        const inverseQ = visible(renderToStaticMarkup(<FractionQuotientBody data={data} task="division-inverse-explanation" isSolutionView={false} />));
        const inverseS = visible(renderToStaticMarkup(<FractionQuotientBody data={data} task="division-inverse-explanation" isSolutionView />));
        expect(inverseQ).toContain('Why? ____________________');
        expect(inverseS).toContain('rebuild');
        expect(inverseS).toContain('×');
    });

    it('word problem Q requires reading prose before the equation and S supplies exact units', () => {
        for (const relationProfile of ['whole-sharing-equation', 'unit-dividend-equation', 'unit-divisor-equation'] as const) {
            const data = sample(relationProfile);
            const q = visible(renderToStaticMarkup(<FractionQuotientBody data={data} task="division-word-problem" isSolutionView={false} />));
            const s = visible(renderToStaticMarkup(<FractionQuotientBody data={data} task="division-word-problem" isSolutionView />));
            expect(q).toContain(data.story.material);
            expect(q).toContain('Equation: ____________________');
            expect(q).not.toContain('÷');
            expect(s).toContain('÷');
            expect(s).toContain(data.orientation === 'whole-by-unit-fraction' ? 'pieces' : 'meter');
            expect(s).toContain('×');
        }
    });

    it('notation leaf shows raw whole-sharing fraction and does not misidentify unit-divisor pieces as meters', () => {
        const whole = sample('fraction-as-quotient');
        const q = visible(renderToStaticMarkup(<FractionQuotientBody data={whole} task="quotient-interpretation" isSolutionView={false} />));
        const s = visible(renderToStaticMarkup(<FractionQuotientBody data={whole} task="quotient-interpretation" isSolutionView />));
        expect(q).toContain(`${whole.dividend.numerator}/${whole.divisor.numerator}`);
        expect(q).not.toContain('Each share is');
        expect(s).toContain('Each share is');

        const group = sample('unit-divisor-basic');
        const groupS = visible(renderToStaticMarkup(<FractionQuotientBody data={group} task="quotient-interpretation" isSolutionView />));
        expect(groupS).toContain('pieces');
        expect(groupS).toContain('Original division:');
        expect(groupS).not.toContain('whole units divided among 1 recipient');
    });
});
