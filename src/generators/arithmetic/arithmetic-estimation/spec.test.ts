import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {spec as equationTargets} from '../../../spec/test/arithmetic-equation-judgment.ts';
import {resolveEstimationClaim} from '../../../visuals/views/operations/operations-answer-reasonableness/helpers.ts';
import {OperationsAnswerReasonablenessViewSchema, spec as viewSpec} from '../../../visuals/views/operations/operations-answer-reasonableness/spec.ts';
import {ArithmeticEstimationGenerator} from './generator.ts';
import {ArithmeticEstimationGeneratorSchema, spec} from './spec.ts';

describe('ArithmeticEstimationGenerator spec integration', () => {
    const generator = new ArithmeticEstimationGenerator();

    it('declares formal integer rounding as invariant mathematics', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.IntegerRounding,
            Scope.IntegerNumbers,
            Scope.NumbersWithoutNegatives
        ]));
        expect(spec.generalLabels).not.toContain(Area.Estimation);
    });

    it('resolves every reviewed operation within 1000', () => {
        for (const operation of [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division]) {
            const stub = generateWithLabels(generator, [operation, Scope.NumbersSmaller1000]);
            expect(stub).not.toBeNull();
            expect(stub!.labels).toEqual(expect.arrayContaining([operation, Scope.NumbersSmaller1000]));
        }
    });

    it.each(equationTargets)('generates the existing small-number target $id through its authoritative plan', target => {
        const planned = planModelCompatibility(target,
            {...spec, spec, schema: ArithmeticEstimationGeneratorSchema},
            {...viewSpec, spec: viewSpec, schema: OperationsAnswerReasonablenessViewSchema});
        if (!planned.supported) throw new Error(`Target ${target.id} was rejected: ${planned.reason}`);
        for (let seed = 0; seed < 50; seed++) {
            const draw = generatePlannedDraw({
                generator, viewSchema: OperationsAnswerReasonablenessViewSchema, plan: planned.plan,
                sampleKey: `${target.id}#${spec.generatorId}#${viewSpec.viewId}#train#question#inst:0`,
                attempt: 1, seed
            });
            expect(draw.stub).not.toBeNull();
            expect(draw.stub!.labels).toContain(Scope.NumbersSmaller20);
            const data = draw.stub!.data;
            expect(data.numberDomain).toEqual({min: 0, max: 20});
            for (const claimSeed of [2 * seed, 2 * seed + 1]) {
                const claim = resolveEstimationClaim(data, claimSeed);
                expect(claim.isReasonable).toBe(claimSeed % 2 === 0);
                expect([claim.proposedAnswer, claim.roundedProposedAnswer, claim.roundedEstimatedAnswer]
                    .every(value => value >= 0 && value <= 20)).toBe(true);
            }
        }
    });
});
