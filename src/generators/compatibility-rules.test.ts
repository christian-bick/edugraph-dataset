import {beforeAll, describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog, type GeneratorModelDescriptor, type ViewModelDescriptor} from '../lib/model-catalog.ts';
import {planModelCompatibility, type ViewChoiceModel} from '../lib/model-compatibility.ts';
import {planCompatibility, sampleGenerationPlan} from '../lib/compatibility.ts';
import {bindingsForSelection} from '../lib/planned-generation.ts';
import {resolveSchemaChoices} from '../lib/schema-choices.ts';
import {generatorLabelRule} from './compatibility-rules.ts';
import {ShapeClassifyAttributesGenerator} from './shape/shape-classify-attributes/generator.ts';

let generators: Map<string, GeneratorModelDescriptor>;
let views: Map<string, ViewModelDescriptor>;
beforeAll(async () => {
    const [generatorCatalog, viewCatalog] = await Promise.all([loadGeneratorModelCatalog(), loadViewModelCatalog()]);
    generators = new Map(generatorCatalog.map(generator => [generator.generatorId, generator]));
    views = new Map(viewCatalog.map(view => [view.viewId, view]));
}, 30_000);

const neutralView: ViewChoiceModel = {
    viewId: 'configuration-contract-test', generalLabels: [], schema: {},
    spec: {viewId: 'configuration-contract-test', generalLabels: []}
};

function plan(generatorId: string, labels: readonly string[], view = neutralView) {
    return planModelCompatibility({id: 'configuration-contract', labels: [...labels]}, generators.get(generatorId)!, view);
}

const cases: readonly [string, string, readonly string[], readonly string[]][] = [
    ['measurement-data', 'single-frame fractions',
        [Scope.SingleFrameOfReference, Scope.FractionNumbers], [Scope.SingleFrameOfReference, Scope.IntegerNumbers]],
    ['statistical-graphs', 'total scale',
        [Area.Addition, Scope.ThreeOperands, Scope.StepsOf1], [Area.Addition, Scope.ThreeOperands, Scope.StepsOf5]],
    ['statistical-graphs', 'arithmetic step complexity',
        [Area.Subtraction, Scope.MultiStep], [Area.Addition, Scope.MultiStep]],
    ['statistical-graphs', 'sorting arithmetic exclusion',
        [Area.ObjectSorting, Scope.StepsOf1], [Area.ObjectSorting, Area.Addition, Scope.SingleStep]],
    ['statistical-graphs', 'operation exclusivity',
        [Area.Addition, Scope.SingleStep], [Area.Addition, Area.Subtraction, Scope.SingleStep]],
    ['statistical-graphs', 'total step exclusion',
        [Area.Addition, Scope.ThreeOperands], [Area.Addition, Scope.ThreeOperands, Scope.SingleStep]],
    ['shape-classify-dim', 'shape dimension',
        [Area.Cube, Scope.ThreeDimensional], [Area.Cube, Scope.TwoDimensional]],
    ['decimal-comparison', 'equality relation',
        [Area.NumericEquality, Scope.Equal], [Area.NumericEquality, Scope.Less]],
    ['fraction-comparison', 'reference equality',
        [Area.FractionReferenceComparison, Area.NumericEquality, Scope.Equal],
        [Area.FractionReferenceComparison, Area.NumericEquality, Scope.Greater]],
    ['fraction-comparison', 'common denominator strategy',
        [Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Greater],
        [Area.FractionCommonDenominatorComparison, Scope.CommonNumerator, Scope.Greater]],
    ['fraction-comparison', 'common numerator inequality',
        [Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, Scope.Less],
        [Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, Scope.Equal]],
    ['fraction-comparison', 'reference common-component exclusion',
        [Area.FractionReferenceComparison, Area.NumericInequality, Scope.Less],
        [Area.FractionReferenceComparison, Area.NumericInequality, Scope.Less, Scope.CommonDenominator]],
    ['fraction-arithmetic', 'multiplication task',
        [Area.Multiplication, Area.IteratedOperation, Scope.IntegerNumbers, Scope.UnitFractions],
        [Area.Multiplication, Scope.FractionNumbers]],
    ['fraction-arithmetic', 'common denominator',
        [Area.Addition, Scope.FractionNumbers, Scope.CommonDenominator], [Area.Addition, Scope.FractionNumbers]],
    ['fraction-arithmetic', 'decomposition operation',
        [Area.Addition, Scope.ProperFractions, Scope.CommonDenominator],
        [Area.Subtraction, Scope.ProperFractions, Scope.CommonDenominator]],
    ['fraction-arithmetic', 'tenths operation conjunction',
        [Area.Addition, Area.Multiplication, Scope.TenthFractions, Scope.CommonDenominator],
        [Area.Addition, Scope.TenthFractions, Scope.CommonDenominator]],
    ['arithmetic-known-fact-derivation', 'commutative multiplication',
        [Area.MultiplicationKnownFactDerivation, Area.CommutativeLaw, Scope.TwoOperands],
        [Area.DivisionKnownFactDerivation, Area.CommutativeLaw, Scope.TwoOperands]],
    ['arithmetic-known-fact-derivation', 'associative arity',
        [Area.MultiplicationKnownFactDerivation, Area.AssociativeLaw, Scope.ThreeOperands],
        [Area.MultiplicationKnownFactDerivation, Area.AssociativeLaw, Scope.TwoOperands]],
    ['arithmetic-known-fact-derivation', 'three-operand strategy',
        [Area.MultiplicationKnownFactDerivation, Area.AssociativeLaw, Scope.ThreeOperands],
        [Area.MultiplicationKnownFactDerivation, Scope.ThreeOperands]],
    ['arithmetic-ops-triples', 'distributive operation conjunction',
        [Area.Addition, Area.Multiplication, Area.DistributiveLaw], [Area.Addition, Area.Multiplication]],
    ['arithmetic-ops-triples', 'law exclusivity',
        [Area.Addition, Area.CommutativeLaw], [Area.Addition, Area.CommutativeLaw, Area.AssociativeLaw]],
    ['arithmetic-ops-triples', 'commutative operation',
        [Area.Multiplication, Area.CommutativeLaw], [Area.Subtraction, Area.CommutativeLaw]],
    ['arithmetic-patterns', 'distributive multiplication',
        [Area.Multiplication, Area.DistributiveLaw], [Area.Addition, Area.DistributiveLaw]],
    ['arithmetic-patterns', 'pattern law exclusivity',
        [Area.Addition, Area.AssociativeLaw], [Area.Addition, Area.AssociativeLaw, Area.CommutativeLaw]],
    ['arithmetic-ops-pairs', 'equal addends sign and zero',
        [Area.Addition, Area.IteratedOperation], [Area.Addition, Area.IteratedOperation, Scope.NumbersWithZero]],
    ['comparison', 'equal zero and negative values',
        [Area.NumericInequality, Scope.Less, Scope.NumbersWithZero, Scope.NumbersWithNegatives],
        [Area.NumericEquality, Scope.Equal, Scope.NumbersWithZero, Scope.NumbersWithNegatives]],
    ['counting-sequence', 'multiple-ten steps',
        [Scope.MultiplesOf10, Scope.StepsOf10], [Scope.MultiplesOf10, Scope.StepsOf5]],
    ['currency-arithmetic', 'coin denomination',
        [Scope.Coins, Scope.QuarterDenomination], [Scope.Coins]],
    ['currency-arithmetic', 'denomination requires coins',
        [Scope.Banknotes], [Scope.Banknotes, Scope.QuarterDenomination]],
    ['place-value-arithmetic', 'single-digit operand profile',
        [Area.Addition, Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand],
        [Area.Addition, Scope.SingleDigitSmallestOperand]],
    ['place-value-arithmetic', 'addition zero exclusion',
        [Area.AdditionPlaceValuePartitioning], [Area.AdditionPlaceValuePartitioning, Scope.NumbersWithZero]],
    ['place-value-arithmetic', 'multiple-ten addition profile',
        [Area.Addition, Scope.MultiplesOf10, Scope.TwoDigitLargestOperand], [Area.Addition, Scope.MultiplesOf10]],
    ['place-value-arithmetic', 'multiple-ten regrouping',
        [Area.Subtraction, Scope.MultiplesOf10], [Area.Subtraction, Scope.MultiplesOf10, Area.IntegerRegrouping]],
    ['place-value-arithmetic', 'subtraction operand profile',
        [Area.Subtraction], [Area.Subtraction, Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand]],
    ['place-value-arithmetic', 'zero regrouping exclusion',
        [Area.SubtractionPlaceValuePartitioning, Scope.NumbersWithZero],
        [Area.SubtractionPlaceValuePartitioning, Scope.NumbersWithZero, Area.IntegerRegrouping]],
    ['area-decomposition', 'distributive area features',
        [Area.DistributiveLaw, Area.Multiplication, Scope.ThreeOperands], [Area.DistributiveLaw]],
    ['geometry-perimeter', 'rectangle equation',
        [Area.Rectangle, Area.Addition, Area.Equation], [Area.Rectangle, Area.Addition]],
    ['shape-classify-attributes', 'criterion exclusivity', [Area.RightAngle], [Area.RightAngle, Area.AcuteAngle]],
    ['shape-classify-attributes', 'subsumption with criterion',
        [Area.ShapeSubsumption, Area.RightTriangle, Area.RightAngle],
        [Area.ShapeSubsumption, Area.RightTriangle, Area.AcuteAngle]],
    ['shape-classify-attributes', 'quadrilateral subsumption',
        [Area.ShapeSubsumption, Area.Square], [Area.ShapeSubsumption, Area.Triangle]],
    ['shape-patterns', 'pattern task presence', [Area.PatternGeneration], []],
    ['shape-position', 'relation presence', [Scope.Above], []],
    ['shape-same-attribute', 'every selectable shape property',
        [Area.Sphere, Area.Cube, Scope.Rollable, Scope.Stackable], [Area.Sphere, Area.Cube, Scope.Rollable]],
    ['time', 'period exclusivity', [Scope.AnteMeridiem], [Scope.AnteMeridiem, Scope.PostMeridiem]],
    ['time', 'five-minute interval', [Scope.StepsOf5, Scope.MinuteIntervals], [Scope.StepsOf5, Scope.HourIntervals]],
    ['time-elapsed', 'elapsed integer count', [Scope.IntegerNumbers], []],
    ['arithmetic-word-problems-two-step', 'operation conjunction size',
        [Area.Addition, Area.Subtraction], [Area.Addition, Area.Subtraction, Area.Multiplication]],
    ['arithmetic-word-problems-letter-equation', 'inherited operation presence', [Area.Addition], []],
    ['arithmetic-word-problems-rounding', 'inherited operation presence', [Area.Subtraction], []]
];

describe('generator configuration compatibility', () => {
    it.each(cases)('%s: %s', (generator, _description, accepted, rejected) => {
        expect(plan(generator, accepted).supported, 'valid semantic configuration').toBe(true);
        const result = plan(generator, rejected);
        expect(result.supported, 'unsupported semantic configuration').toBe(false);
        if (!result.supported) expect(result.reason).toBe('incompatible-rules');
    });

    it('rejects competing explicit attribute count modes before rule evaluation', () => {
        expect(plan('shape-classify-attributes', [Scope.VertexCount]).supported).toBe(true);
        const result = plan('shape-classify-attributes', [Scope.VertexCount, Scope.AngleCount]);
        expect(result).toMatchObject({supported: false, reason: 'empty-domain',
            fields: [{owner: 'generator', field: 'attributeCounts'}]});
    });

    it.each([
        {requested: [Scope.FaceCount]},
        {requested: [Scope.FaceCount, Scope.Equal]}
    ])('completes $requested with an admitted equal-face mode without altering the request', ({requested}) => {
        const result = plan('shape-classify-attributes', requested);
        expect(result.supported).toBe(true);
        if (!result.supported) return;
        expect(result.plan.targetLabels).toEqual([...requested].sort());
        const receipt = sampleGenerationPlan(result.plan, () => 0);
        const selection = bindingsForSelection(result.plan, receipt);
        expect(selection.generator.attributeCounts).toEqual([Scope.Equal, Scope.FaceCount]);
        const generator = new ShapeClassifyAttributesGenerator();
        const resolved = resolveSchemaChoices(generator.schema, requested, selection.generator);
        expect(resolved.config.attributeCounts).toEqual([Scope.FaceCount, Scope.Equal]);
        expect(generator.generate(resolved.config)?.data).toMatchObject({
            task: 'classify-count', attribute: 'equal-faces', requiredCount: 6
        });
    });

    it('rejects a target scale that the tool-based length resolver cannot accept', () => {
        const scaleView: ViewChoiceModel = {
            ...neutralView, generalLabels: [Scope.CentimeterScale],
            spec: {...neutralView.spec, generalLabels: [Scope.CentimeterScale]}
        };
        expect(plan('measurement-length', [Scope.PhysicalRuler], scaleView).supported).toBe(true);
        expect(plan('measurement-length', [Scope.PhysicalRuler, Scope.CentimeterScale], scaleView).supported).toBe(false);
    });

    it('restricts deferred selections without changing explicit target requests', () => {
        const result = plan('shape-classify-dim', [Area.Cube]);
        expect(result.supported).toBe(true);
        if (!result.supported) return;
        const receipt = sampleGenerationPlan(result.plan, () => 0);
        const selection = bindingsForSelection(result.plan, receipt);
        const config = resolveSchemaChoices(generators.get('shape-classify-dim')!.schema!, [Area.Cube], selection.generator).config;
        expect(config.dimension).toBe(Scope.ThreeDimensional);
        expect(result.plan.targetLabels).toEqual([Area.Cube]);
    });

    it('enforces helper dependency declarations', () => {
        expect(() => planCompatibility({
            identity: {targetId: 'target', generatorId: 'generator', viewId: 'view'},
            targetLabels: [], generatorLabels: [], viewLabels: [], fields: [],
            generatorRules: [generatorLabelRule('undeclared-read', [], selected => selected(Scope.IntegerNumbers))]
        })).toThrow(/undeclared/i);
    });

    it('does not move numeric range feasibility into semantic compatibility', () => {
        expect(plan('arithmetic-ops-pairs', [Area.Addition, Scope.NumbersSmaller5, Scope.MultiplesOf10]).supported).toBe(true);
    });
});

describe('measurement line plot configuration compatibility', () => {
    it('keeps only integer variants for unit steps', () => {
        const view = views.get('measurement-line-plot')!;
        const result = plan('measurement-data', [Scope.StepsOf1], view);
        expect(result.supported).toBe(true);
        if (!result.supported) return;
        const receipt = sampleGenerationPlan(result.plan, () => 0);
        const selection = bindingsForSelection(result.plan, receipt);
        expect(selection.generator.numberKind).toEqual([Scope.IntegerNumbers]);
        expect(result.plan.targetLabels).toEqual([Scope.StepsOf1]);
    });

    it('rejects explicit fractions and single-frame fractions when unit steps are required', () => {
        const view = views.get('measurement-line-plot')!;
        expect(plan('measurement-data', [Scope.StepsOf1, Scope.FractionNumbers], view).supported).toBe(false);
        expect(plan('measurement-data', [Scope.StepsOf1, Scope.SingleFrameOfReference], view).supported).toBe(false);
    });
});
