import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {CoordinatePointsGenerator} from './generator.ts';
import {CoordinatePointsGeneratorSchema, spec} from './spec.ts';

const numberKinds = [[Scope.IntegerNumbers, Scope.RationalNumbers], [Scope.FractionNumbers], [Scope.DecimalNumbers]];

describe('coordinate point schema ownership and production resolution', () => {
    it('owns ordered pairs alone and declares complete exact form/evidence bundles', () => {
        expect(spec.generalLabels).toEqual([Area.OrderedCoordinatePair]);
        expect(CoordinatePointsGeneratorSchema.numberKind[2]).toEqual(numberKinds);
        expect(CoordinatePointsGeneratorSchema.quadrantEvidence[2]).toEqual([[], [Area.Quadrants, Area.SignNotation]]);
        expect(() => CoordinatePointsGeneratorSchema.numberKind[1]([Scope.IntegerNumbers, Scope.DecimalNumbers])).toThrow();
        expect(() => CoordinatePointsGeneratorSchema.signDomain[1]([Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives])).toThrow();
        expect(CoordinatePointsGeneratorSchema.quadrantEvidence[1]([])).toBe('ordinary');
    });

    it.each(numberKinds)('resolves each exact admitted number-kind bundle %j without inventing capabilities', (...bundle) => {
        const kind = bundle.includes(Scope.IntegerNumbers) ? 'integer' : bundle.includes(Scope.FractionNumbers) ? 'fraction' : 'decimal';
        const labels = [...bundle, Scope.NumbersWithoutNegatives];
        const resolved = extractConfig(CoordinatePointsGeneratorSchema, labels);
        expect(resolved.config).toEqual({numberKind: kind, signDomain: 'nonnegative', quadrantEvidence: 'ordinary'});
        expect(new Set(resolved.resolvedLabels)).toEqual(new Set(labels));
        expect(generateWithLabels(new CoordinatePointsGenerator(), labels)!.data.points).toHaveLength(3);
    });

    it('resolves all real plotting/reading permutations and the broad rational quadrant target through authoritative plans', () => {
        const cases = [
            ...[Scope.IntegerNumbers, Scope.FractionNumbers, Scope.DecimalNumbers].flatMap(kind =>
                [Scope.NumbersWithoutNegatives, Scope.NumbersWithNegatives].flatMap(sign => [
                    {labels: [Area.PointPlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation, kind, sign],
                        viewLabels: [Area.PointPlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation]},
                    {labels: [Area.OrderedCoordinatePair, Scope.CartesianCoordinateSystem, Ability.VisualReception, kind, sign],
                        viewLabels: [Scope.CartesianCoordinateSystem, Ability.VisualReception]}
                ])),
            {labels: [Area.OrderedCoordinatePair, Area.Quadrants, Area.SignNotation, Scope.RationalNumbers, Scope.CartesianCoordinateSystem, Ability.Interpretation],
                viewLabels: [Scope.CartesianCoordinateSystem, Ability.Interpretation]}
        ];
        for (const {labels, viewLabels} of cases) {
            const result = planCompatibility({identity: {targetId: 'coordinate-regression', generatorId: spec.generatorId, viewId: 'coordinate-regression-view'},
                targetLabels: labels, generatorLabels: spec.generalLabels, viewLabels,
                fields: normalizeSchemaChoices(CoordinatePointsGeneratorSchema, labels, 'generator'), generatorRules: spec.compatibility});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            for (let seed = 0; seed < 12; seed++) {
                const draw = generatePlannedDraw({generator: new CoordinatePointsGenerator(), viewSchema: {}, plan: result.plan,
                    sampleKey: 'coordinate-regression#coordinate-points#coordinate-regression-view#train#question#inst:0', seed, attempt: 1});
                expect(draw.stub!.data.kind).toBe('coordinate-points');
                if (labels.includes(Area.Quadrants)) {
                    expect(draw.labels).toContain(Area.Quadrants);
                    expect(draw.labels).toContain(Scope.NumbersWithNegatives);
                    expect(draw.stub!.data.points).toHaveLength(7);
                }
            }
        }
    });

    it('preserves seeded content independent of learner Ability', () => {
        const labels = [...numberKinds[0]!, Scope.NumbersWithNegatives];
        setSeed(61);
        const first = generateWithLabels(new CoordinatePointsGenerator(), [...labels, Ability.VisualArticulation]);
        setSeed(61);
        expect(generateWithLabels(new CoordinatePointsGenerator(), [...labels, Ability.VisualReception])).toEqual(first);
    });
});
