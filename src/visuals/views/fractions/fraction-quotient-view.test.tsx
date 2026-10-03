import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionQuotientModelGenerator} from '../../../generators/fraction/fraction-quotient-model/generator.ts';
import {FractionQuotientBody} from './fraction-quotient-view.tsx';

const generator = new FractionQuotientModelGenerator();
const sample = (relationProfile: Parameters<FractionQuotientModelGenerator['generate']>[0]['relationProfile']) => {
    setSeed(`quotient-render-${relationProfile}`);
    return generator.generate({relationProfile}).data;
};
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('fraction quotient task projections', () => {
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
