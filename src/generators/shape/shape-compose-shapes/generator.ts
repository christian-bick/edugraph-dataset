import {Area, Scope} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    ShapeCompositionComposite,
    ShapeCompositionNode,
    ShapeComposeShapesProblem
} from '../../../types/problems.ts';
import {
    ShapeComposeShapesGeneratorConfig,
    ShapeComposeShapesGeneratorSchema
} from './spec.ts';

type CompositionStructure =
    | typeof Scope.SingleLevelComposition
    | typeof Scope.MultiLevelComposition;

interface CompositionRecipe {
    tree: ShapeCompositionComposite;
    distractor: string;
}

const NUMBER_WORDS: Readonly<Record<number, string>> = {
    2: 'Two',
    3: 'Three',
    6: 'Six'
};

const ONTOLOGY_LABEL_BY_SHAPE: Readonly<Record<string, string>> = {
    triangle: Area.Triangle,
    'smaller triangle': Area.Triangle,
    'tiny triangle': Area.Triangle,
    square: Area.Square,
    rectangle: Area.Rectangle,
    hexagon: Area.Hexagon,
    trapezoid: Area.Trapezoid,
    'half circle': Area.HalfCircle,
    'quarter circle': Area.QuarterCircle,
    cube: Area.Cube,
    'smaller cube': Area.Cube,
    'rectangular prism': Area.RectangularPrism,
    cone: Area.Cone,
    cylinder: Area.Cylinder,
    'shorter cylinder': Area.Cylinder,
    'cylinder segment': Area.Cylinder
};

function primitive(shape: string): ShapeCompositionNode {
    return {kind: 'primitive', shape};
}

function composite(shape: string, inputs: ShapeCompositionNode[]): ShapeCompositionComposite {
    return {kind: 'composite', shape, inputs};
}

function repeatedPrimitive(shape: string, count: number): ShapeCompositionNode[] {
    return Array.from({length: count}, () => primitive(shape));
}

function repeatedComposite(
    shape: string,
    count: number,
    primitiveShape: string,
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
    tree: ShapeCompositionComposite,
    structure: CompositionStructure
): boolean {
    if (!isValidNode(tree)) return false;

    const depth = getCompositionDepth(tree);
    if (structure === Scope.SingleLevelComposition) {
        return depth === 1 && tree.inputs.every(input => input.kind === 'primitive');
    }

    return depth === 2 && tree.inputs.some(input => input.kind === 'composite');
}

function describeInputs(inputs: ShapeCompositionNode[]): string | null {
    const shapes = new Set(inputs.map(input => input.shape));
    if (shapes.size !== 1) return null;

    const countWord = NUMBER_WORDS[inputs.length];
    if (!countWord) return null;
    return `${countWord} ${inputs[0].shape}s`;
}

function collectComponentTags(
    tree: ShapeCompositionComposite,
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

function singleLevelRecipe(label: string): CompositionRecipe | null {
    if (label === Area.Rectangle) {
        return recipe(composite('rectangle', repeatedPrimitive('triangle', 2)), 'Two circles');
    }
    if (label === Area.Square) {
        return recipe(composite('square', repeatedPrimitive('triangle', 2)), 'Two circles');
    }
    if (label === Area.Triangle) {
        return recipe(composite('triangle', repeatedPrimitive('smaller triangle', 2)), 'Two squares');
    }
    if (label === Area.Hexagon) {
        return recipe(composite('hexagon', repeatedPrimitive('triangle', 6)), 'Six circles');
    }
    if (label === Area.Trapezoid) {
        return recipe(composite('trapezoid', repeatedPrimitive('triangle', 3)), 'Three squares');
    }
    if (label === Area.HalfCircle) {
        return recipe(
            composite('half circle', repeatedPrimitive('quarter circle', 2)),
            'Two triangles'
        );
    }
    if (label === Area.QuarterCircle) {
        return recipe(
            composite('quarter circle', repeatedPrimitive('eighth-circle piece', 2)),
            'Two squares'
        );
    }
    if (label === Area.Cube) {
        return recipe(
            composite('cube', repeatedPrimitive('rectangular prism', 2)),
            'Two cones'
        );
    }
    if (label === Area.RectangularPrism) {
        return recipe(
            composite('rectangular prism', repeatedPrimitive('cube', 2)),
            'Two spheres'
        );
    }
    if (label === Area.Cone) {
        return recipe(composite('cone', repeatedPrimitive('half-cone', 2)), 'Two cylinders');
    }
    if (label === Area.Cylinder) {
        return recipe(
            composite('cylinder', repeatedPrimitive('shorter cylinder', 2)),
            'Two cones'
        );
    }
    return null;
}

function multiLevelRecipe(label: string): CompositionRecipe | null {
    if (label === Area.Rectangle) {
        return recipe(
            composite('rectangle', repeatedComposite('square', 2, 'triangle', 2)),
            'Two circles'
        );
    }
    if (label === Area.Square) {
        return recipe(
            composite('square', repeatedComposite('rectangle', 2, 'triangle', 2)),
            'Two circles'
        );
    }
    if (label === Area.Triangle) {
        return recipe(
            composite(
                'triangle',
                repeatedComposite('smaller triangle', 2, 'tiny triangle', 2)
            ),
            'Two squares'
        );
    }
    if (label === Area.Hexagon) {
        return recipe(
            composite('hexagon', repeatedComposite('trapezoid', 2, 'triangle', 3)),
            'Two circles'
        );
    }
    if (label === Area.Trapezoid) {
        return recipe(
            composite(
                'trapezoid',
                repeatedComposite('triangle', 3, 'smaller triangle', 2)
            ),
            'Three squares'
        );
    }
    if (label === Area.HalfCircle) {
        return recipe(
            composite(
                'half circle',
                repeatedComposite('quarter circle', 2, 'eighth-circle piece', 2)
            ),
            'Two triangles'
        );
    }
    if (label === Area.QuarterCircle) {
        return recipe(
            composite(
                'quarter circle',
                repeatedComposite('eighth-circle piece', 2, 'sixteenth-circle piece', 2)
            ),
            'Two squares'
        );
    }
    if (label === Area.Cube) {
        return recipe(
            composite(
                'cube',
                repeatedComposite('rectangular prism', 2, 'smaller cube', 4)
            ),
            'Two cones'
        );
    }
    if (label === Area.RectangularPrism) {
        return recipe(
            composite(
                'rectangular prism',
                repeatedComposite('cube', 2, 'smaller cube', 8)
            ),
            'Two spheres'
        );
    }
    if (label === Area.Cone) {
        return recipe(
            composite('cone', repeatedComposite('half-cone', 2, 'quarter-cone piece', 2)),
            'Two cylinders'
        );
    }
    if (label === Area.Cylinder) {
        return recipe(
            composite(
                'cylinder',
                repeatedComposite('shorter cylinder', 2, 'cylinder segment', 2)
            ),
            'Two cones'
        );
    }
    return null;
}

function recipe(tree: ShapeCompositionComposite, distractor: string): CompositionRecipe {
    return {tree, distractor};
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

        const recipe = structure === Scope.SingleLevelComposition
            ? singleLevelRecipe(config.classify!)
            : multiLevelRecipe(config.classify!);
        if (!recipe || !isValidTreeForStructure(recipe.tree, structure)) return null;

        const answer = describeInputs(recipe.tree.inputs);
        if (!answer) return null;

        const compositionDepth = getCompositionDepth(recipe.tree);
        if (compositionDepth !== 1 && compositionDepth !== 2) return null;

        const componentTags = collectComponentTags(recipe.tree, config.classify!);

        return {
            data: {
                target: recipe.tree.shape,
                components: recipe.tree.inputs.map(input => input.shape),
                options: [answer, recipe.distractor],
                answer,
                compositionTree: recipe.tree,
                compositionDepth
            },
            tags: componentTags.length > 0 ? componentTags : undefined
        };
    }
}
