import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapeBuildShapeProblem} from "../../../types/problems.ts";
import {ShapeBuildShapeGeneratorConfig, ShapeBuildShapeGeneratorSchema} from "./spec.ts";
import {Area, Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from "../../../lib/errors.ts";
import {getShapeDefinition, shapeNameFromLabel} from '../helpers.ts';
import {random} from '../../../lib/random.ts';

const VERTEX_TARGETS = [
    {target: 'triangle', label: Area.Triangle, count: 3},
    {target: 'quadrilateral', label: Area.Quadrilateral, count: 4},
    {target: 'pentagon', label: Area.Pentagon, count: 5},
    {target: 'hexagon', label: Area.Hexagon, count: 6}
] as const;

export class ShapeBuildShapeGenerator implements ProblemGenerator<ShapeBuildShapeProblem, ShapeBuildShapeGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeBuildShapeGeneratorSchema;

    generate(config: ShapeBuildShapeGeneratorConfig): ProblemStub<ShapeBuildShapeProblem> | null {
        validateConfigFields('shape-build-shape', config, [
            'specifyAttributes'
        ]);
        if (!Array.isArray(config.targets) || !Array.isArray(config.constructionScopes) || !Array.isArray(config.attributeCounts)) {
            throw new GeneratorValidationError(
                'shape-build-shape',
                'The targets, constructionScopes, and attributeCounts fields must be arrays.'
            );
        }

        const useVertexCount = config.attributeCounts!.includes(Scope.VertexCount);
        const useFaceCount = config.attributeCounts!.includes(Scope.FaceCount);
        const requireEqualFaces = config.attributeCounts!.includes(Scope.Equal);
        const isAttributeSpecification = config.specifyAttributes
            && config.shapeArea === Area.ShapeClassification
            && !config.constructionScopes!.includes(Scope.ShapeProperties);

        if (isAttributeSpecification && useVertexCount && !useFaceCount && !requireEqualFaces) {
            const selected = VERTEX_TARGETS[Math.floor(random() * VERTEX_TARGETS.length)];
            return {
                data: {
                    target: selected.target,
                    sides: selected.count,
                    corners: selected.count,
                    task: 'specify-count',
                    attribute: 'vertices',
                    requiredCount: selected.count
                },
                tags: [selected.label]
            };
        }

        if (isAttributeSpecification && !useVertexCount && useFaceCount && requireEqualFaces) {
            return {
                data: {
                    target: 'cube',
                    sides: 12,
                    corners: 8,
                    task: 'specify-count',
                    attribute: 'equal-faces',
                    requiredCount: 6
                },
                tags: [Area.Cube]
            };
        }

        if (useVertexCount || useFaceCount || requireEqualFaces) {
            throw new GeneratorValidationError(
                'shape-build-shape',
                'Attribute-count labels must select either vertex count or equal face count.'
            );
        }

        if (config.targets!.length !== 1) return null;
        const target = shapeNameFromLabel(config.targets![0]);
        if (!target) return null;

        const definition = getShapeDefinition(target);
        const construction = {
            target,
            sides: definition.sideCount,
            corners: definition.vertexCount
        };

        if (config.shapeArea === Area.ShapeSubsumption && !config.specifyAttributes) {
            if (target !== 'quadrilateral') return null;
            return {
                data: {
                    target,
                    sides: 4,
                    corners: 4,
                    task: 'exclude-quadrilateral-subcategories',
                    definition: {
                        sideCount: 4,
                        vertexCount: 4,
                        closed: true,
                        boundary: 'straight',
                        equalSides: false,
                        rightAngleCount: 0
                    },
                    excludedCategories: ['rhombus', 'rectangle', 'square']
                },
                tags: []
            };
        }

        if (config.shapeArea === Area.ShapeRotationConservation && !config.specifyAttributes) {
            return {
                data: {...construction, task: 'rotation-conservation'},
                tags: []
            };
        }

        if (!config.specifyAttributes) {
            return {data: construction, tags: []};
        }

        if (isAttributeSpecification) {
            return {
                data: {
                    ...construction,
                    task: 'specify-attributes',
                    definition
                },
                tags: []
            };
        }

        return null;
    }
}
