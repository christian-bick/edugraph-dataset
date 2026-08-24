import {Area, Scope} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    ShapeCompositionComposite,
    ShapeCompositionNode,
    ShapeCompositionRoot,
    ShapeCompositionShapeId,
    ShapeCompositionTargetId,
    ShapeComposeShapesProblem
} from '../../../types/problems.ts';
import {
    ShapeComposeShapesGeneratorConfig,
    ShapeComposeShapesGeneratorSchema
} from './spec.ts';

type CompositionStructure =
    | typeof Scope.SingleLevelComposition
    | typeof Scope.MultiLevelComposition;

const ONTOLOGY_LABEL_BY_SHAPE: Readonly<Partial<Record<ShapeCompositionShapeId, string>>> = {
    triangle: Area.Triangle,
    'small-triangle': Area.Triangle,
    'tiny-triangle': Area.Triangle,
    square: Area.Square,
    rectangle: Area.Rectangle,
    hexagon: Area.Hexagon,
    trapezoid: Area.Trapezoid,
    'half-circle': Area.HalfCircle,
    'quarter-circle': Area.QuarterCircle,
    cube: Area.Cube,
    'small-cube': Area.Cube,
    'rectangular-prism': Area.RectangularPrism,
    cone: Area.Cone,
    cylinder: Area.Cylinder,
    'short-cylinder': Area.Cylinder,
    'cylinder-segment': Area.Cylinder
};

function primitive(shape: ShapeCompositionShapeId): ShapeCompositionNode {
    return {kind: 'primitive', shape};
}

function composite(shape: ShapeCompositionShapeId, inputs: ShapeCompositionNode[]): ShapeCompositionComposite {
    return {kind: 'composite', shape, inputs};
}

function root(shape: ShapeCompositionTargetId, inputs: ShapeCompositionNode[]): ShapeCompositionRoot {
    return {kind: 'composite', shape, inputs};
}

function repeatedPrimitive(shape: ShapeCompositionShapeId, count: number): ShapeCompositionNode[] {
    return Array.from({length: count}, () => primitive(shape));
}

function repeatedComposite(
    shape: ShapeCompositionShapeId,
    count: number,
    primitiveShape: ShapeCompositionShapeId,
    primitiveCount: number
): ShapeCompositionNode[] {
    return Array.from({length: count}, () =>
        composite(shape, repeatedPrimitive(primitiveShape, primitiveCount))
    );
}

function getCompositionDepth(node: ShapeCompositionNode): number {
    if (node.kind === 'primitive') return 0;
    return 1 + Math.max(...node.inputs.map(getCompositionDepth));
}

function isValidNode(node: ShapeCompositionNode): boolean {
    if (!node.shape.trim()) return false;
    if (node.kind === 'primitive') return true;
    return node.inputs.length >= 2 && node.inputs.every(isValidNode);
}

function isValidTreeForStructure(
    tree: ShapeCompositionRoot,
    structure: CompositionStructure
): boolean {
    if (!isValidNode(tree)) return false;

    const depth = getCompositionDepth(tree);
    if (structure === Scope.SingleLevelComposition) {
        return depth === 1 && tree.inputs.every(input => input.kind === 'primitive');
    }

    return depth === 2 && tree.inputs.some(input => input.kind === 'composite');
}

function collectComponentTags(
    tree: ShapeCompositionRoot,
    configuredTarget: string
): string[] {
    const tags = new Set<string>();

    const visit = (node: ShapeCompositionNode): void => {
        const label = ONTOLOGY_LABEL_BY_SHAPE[node.shape];
        if (label && label !== configuredTarget) tags.add(label);
        if (node.kind === 'composite') node.inputs.forEach(visit);
    };

    tree.inputs.forEach(visit);
    return [...tags];
}

function singleLevelComposition(label: string): ShapeCompositionRoot | null {
    if (label === Area.Rectangle) {
        return root('rectangle', repeatedPrimitive('triangle', 2));
    }
    if (label === Area.Square) {
        return root('square', repeatedPrimitive('triangle', 2));
    }
    if (label === Area.Triangle) {
        return root('triangle', repeatedPrimitive('small-triangle', 2));
    }
    if (label === Area.Hexagon) {
        return root('hexagon', repeatedPrimitive('triangle', 6));
    }
    if (label === Area.Trapezoid) {
        return root('trapezoid', repeatedPrimitive('triangle', 3));
    }
    if (label === Area.HalfCircle) {
        return root('half-circle', repeatedPrimitive('quarter-circle', 2));
    }
    if (label === Area.QuarterCircle) {
        return root('quarter-circle', repeatedPrimitive('eighth-circle-piece', 2));
    }
    if (label === Area.Cube) {
        return root('cube', repeatedPrimitive('rectangular-prism', 2));
    }
    if (label === Area.RectangularPrism) {
        return root('rectangular-prism', repeatedPrimitive('cube', 2));
    }
    if (label === Area.Cone) {
        return root('cone', repeatedPrimitive('half-cone', 2));
    }
    if (label === Area.Cylinder) {
        return root('cylinder', repeatedPrimitive('short-cylinder', 2));
    }
    return null;
}

function multiLevelComposition(label: string): ShapeCompositionRoot | null {
    if (label === Area.Rectangle) {
        return root('rectangle', repeatedComposite('square', 2, 'triangle', 2));
    }
    if (label === Area.Square) {
        return root('square', repeatedComposite('rectangle', 2, 'triangle', 2));
    }
    if (label === Area.Triangle) {
        return root(
            'triangle',
            repeatedComposite('small-triangle', 2, 'tiny-triangle', 2)
        );
    }
    if (label === Area.Hexagon) {
        return root('hexagon', repeatedComposite('trapezoid', 2, 'triangle', 3));
    }
    if (label === Area.Trapezoid) {
        return root(
            'trapezoid',
            repeatedComposite('triangle', 3, 'small-triangle', 2)
        );
    }
    if (label === Area.HalfCircle) {
        return root(
            'half-circle',
            repeatedComposite('quarter-circle', 2, 'eighth-circle-piece', 2)
        );
    }
    if (label === Area.QuarterCircle) {
        return root(
            'quarter-circle',
            repeatedComposite('eighth-circle-piece', 2, 'sixteenth-circle-piece', 2)
        );
    }
    if (label === Area.Cube) {
        return root(
            'cube',
            repeatedComposite('rectangular-prism', 2, 'small-cube', 4)
        );
    }
    if (label === Area.RectangularPrism) {
        return root(
            'rectangular-prism',
            repeatedComposite('cube', 2, 'small-cube', 8)
        );
    }
    if (label === Area.Cone) {
        return root(
            'cone',
            repeatedComposite('half-cone', 2, 'quarter-cone-piece', 2)
        );
    }
    if (label === Area.Cylinder) {
        return root(
            'cylinder',
            repeatedComposite('short-cylinder', 2, 'cylinder-segment', 2)
        );
    }
    return null;
}

export class ShapeComposeShapesGenerator implements ProblemGenerator<
    ShapeComposeShapesProblem,
    ShapeComposeShapesGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeComposeShapesGeneratorSchema;

    generate(
        config: ShapeComposeShapesGeneratorConfig
    ): ProblemStub<ShapeComposeShapesProblem> | null {
        validateConfigFields('shape-compose-shapes', config, [
            'classify',
            'compositionStructure'
        ]);

        const structure = config.compositionStructure;
        if (
            structure !== Scope.SingleLevelComposition &&
            structure !== Scope.MultiLevelComposition
        ) return null;

        const compositionTree = structure === Scope.SingleLevelComposition
            ? singleLevelComposition(config.classify!)
            : multiLevelComposition(config.classify!);
        if (!compositionTree || !isValidTreeForStructure(compositionTree, structure)) return null;

        const compositionDepth = getCompositionDepth(compositionTree);
        if (compositionDepth !== 1 && compositionDepth !== 2) return null;

        const componentTags = collectComponentTags(compositionTree, config.classify!);

        return {
            data: {
                compositionTree,
                compositionDepth
            },
            tags: componentTags.length > 0 ? componentTags : undefined
        };
    }
}
