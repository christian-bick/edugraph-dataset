import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapeComposeShapesProblem} from "../../../types/problems.ts";
import {ShapeComposeShapesGeneratorConfig, ShapeComposeShapesGeneratorSchema} from "./spec.ts";
import {Area} from "edugraph-ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class ShapeComposeShapesGenerator implements ProblemGenerator<ShapeComposeShapesProblem, ShapeComposeShapesGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeComposeShapesGeneratorSchema;

    generate(config: ShapeComposeShapesGeneratorConfig): ProblemStub | null {
        validateConfigFields('shape-compose-shapes', config, ['classify']);
        const label = config.classify!;

        const recipe = this.resolveRecipe(label);
        if (!recipe) return null;

        return {
            data: {
                target: recipe.target,
                components: [...recipe.components],
                options: [recipe.answer, recipe.distractor],
                answer: recipe.answer
            },
            tags: recipe.componentTag ? [recipe.componentTag] : undefined
        };
    }

    private resolveRecipe(label: string): CompositionRecipe | null {
        if (label === Area.Rectangle) return recipe('rectangle', ['triangle', 'triangle'], 'Two triangles', 'Two circles', Area.Triangle);
        if (label === Area.Square) return recipe('square', ['triangle', 'triangle'], 'Two triangles', 'Two circles', Area.Triangle);
        if (label === Area.Triangle) return recipe('triangle', ['smaller triangle', 'smaller triangle'], 'Two smaller triangles', 'Two squares');
        if (label === Area.Hexagon) return recipe('hexagon', Array(6).fill('triangle'), 'Six triangles', 'Six circles', Area.Triangle);
        if (label === Area.Trapezoid) return recipe('trapezoid', Array(3).fill('triangle'), 'Three triangles', 'Three squares', Area.Triangle);
        if (label === Area.HalfCircle) return recipe('half circle', ['quarter circle', 'quarter circle'], 'Two quarter circles', 'Two triangles', Area.QuarterCircle);
        if (label === Area.QuarterCircle) return recipe('quarter circle', ['eighth-circle piece', 'eighth-circle piece'], 'Two eighth-circle pieces', 'Two squares');
        if (label === Area.Cube) return recipe('cube', ['rectangular prism', 'rectangular prism'], 'Two rectangular prisms', 'Two cones');
        if (label === Area.RectangularPrism) return recipe('rectangular prism', ['cube', 'cube'], 'Two cubes', 'Two spheres', Area.Cube);
        if (label === Area.Cone) return recipe('cone', ['half-cone', 'half-cone'], 'Two half-cones', 'Two cylinders');
        if (label === Area.Cylinder) return recipe('cylinder', ['shorter cylinder', 'shorter cylinder'], 'Two shorter cylinders', 'Two cones');
        return null;
    }
}

interface CompositionRecipe {
    target: string;
    components: string[];
    answer: string;
    distractor: string;
    componentTag?: string;
}

function recipe(
    target: string,
    components: string[],
    answer: string,
    distractor: string,
    componentTag?: string
): CompositionRecipe {
    return {target, components, answer, distractor, componentTag};
}
