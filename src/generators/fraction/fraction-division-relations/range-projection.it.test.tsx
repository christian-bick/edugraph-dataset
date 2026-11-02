import {Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {GeneralFractionDivisionBody} from '../../../visuals/views/fractions/fraction-division-view.tsx';
import {FractionDivisionRelationsGenerator} from './generator.ts';
import {divisionRangeRows, hasSharedDivisionRange} from './numeric-domain.ts';
import {divisionOperandDistribution} from './operand-profiles.ts';
import {FractionDivisionRelationsGeneratorSchema as schema, spec} from './spec.ts';

const profiles = [
    [[Scope.FractionDividend, Scope.FractionDivisor, Scope.ProperFractions], 'fraction-by-fraction-proper'],
    [[Scope.FractionDividend, Scope.FractionDivisor, Scope.ImproperFractions], 'fraction-by-fraction-improper'],
    [[Scope.FractionDividend, Scope.IntegerDivisor, Scope.ProperFractions], 'fraction-by-integer-proper'],
    [[Scope.FractionDividend, Scope.IntegerDivisor, Scope.ImproperFractions], 'fraction-by-integer-improper'],
    [[Scope.IntegerDividend, Scope.FractionDivisor, Scope.ProperFractions], 'integer-by-fraction-proper'],
    [[Scope.IntegerDividend, Scope.FractionDivisor, Scope.ImproperFractions], 'integer-by-fraction-improper']
] as const;
const ranges = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100]] as const;
const matcher = (labels: string[]) => planModelCompatibility({id: 'shared-division-band', labels},
    {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
    {viewId: 'division-proof', generalLabels: [], schema: {}, spec: {viewId: 'division-proof', generalLabels: []}});

describe('common-part division range projections', () => {
    it('exposes38 settled bands across all six Question/Solution task leaves', () => {
        let combinations = 0;
        for (const [roles, profile] of profiles) for (const group of ['zero', 'positive'] as const) {
            if (!divisionOperandDistribution(profile, group).length || !hasSharedDivisionRange(profile, group)) continue;
            const zeroLabel = group === 'zero' ? Scope.NumbersWithZero : Scope.NumbersWithoutZero;
            for (const [label, upper] of ranges) {
                const labels = [...roles, zeroLabel, label];
                const range = createCanonicalNumericRange(upper);
                if (!divisionRangeRows(profile, group, range).length) {
                    expect(matcher(labels).supported).toBe(false);
                    expect(() => extractConfig(schema, labels)).toThrow();
                    continue;
                }
                expect(matcher(labels).supported).toBe(true);
                const resolved = extractConfig(schema, labels);
                expect(resolved.config.range).toEqual(range);
                const data = new FractionDivisionRelationsGenerator().generate(resolved.config).data;
                for (const task of ['division-execution', 'division-interpretation', 'division-inverse-explanation',
                    'division-story-creation', 'division-word-problem', 'division-model-construction'] as const) {
                    const question = renderToStaticMarkup(<GeneralFractionDivisionBody data={data} task={task} isSolutionView={false} />);
                    const solution = renderToStaticMarkup(<GeneralFractionDivisionBody data={data} task={task} isSolutionView={true} />);
                    expect(question).toContain('Use the count of complete divisor-sized groups');
                    expect(solution).toContain(`The numerical model has ${data.model.completeGroups} complete divisor-sized`);
                    if (data.model.remainderTicks > 0) expect(solution)
                        .toContain(`(${data.model.remainderTicks} of its ${data.model.divisorTicks} equal ticks)`);
                }
                combinations++;
            }
        }
        expect(combinations).toBe(38);
    });

    it('completes every feasible operand/group choice with a canonical range', () => {
        for (const [roles, profile] of profiles) for (const group of ['zero', 'positive'] as const) {
            if (!hasSharedDivisionRange(profile, group)) continue;
            const result = extractConfig(schema, [...roles, group === 'zero' ? Scope.NumbersWithZero : Scope.NumbersWithoutZero]);
            expect(result.config.range!.max).toBeLessThanOrEqual(100);
            expect(result.resolvedLabels.some(label => ranges.some(([upper]) => upper === label))).toBe(true);
        }
    });

    it('filters infeasible group fallbacks before direct range resolution', () => {
        const request = [Scope.FractionDividend, Scope.IntegerDivisor, Scope.ImproperFractions, Scope.NumbersSmaller100];
        for (let index = 0; index < 16; index++) {
            const result = extractConfig(schema, request);
            expect(result.config.groupCountProfile).toBe('zero');
            expect(result.resolvedLabels).toContain(Scope.NumbersWithZero);
            expect(result.config.range?.max).toBe(100);
        }
    });
});
