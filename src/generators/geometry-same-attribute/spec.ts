import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasSubConcept} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-same-attribute',
    supportedLabels: [
        Area.ObjectSorting,
        Scope.ShapeProperties
    ]
};


export const GeometrySameAttributeGeneratorSchema = {
    // TODO: Ontological relations could be beneficial for ShapeProperties here in the future
    rollable: [
        [Scope.Rollable, 'not-rollable'],
        hasSubConcept(Scope.Rollable)
    ],
    stackable: [
        [Scope.Stackable, 'not-stackable'],
        hasSubConcept(Scope.Stackable)
    ],
    flatFaces: [
        [Scope.FlatFaces, 'no-flat-faces'],
        hasSubConcept(Scope.FlatFaces)
    ]
} as const;

export type GeometrySameAttributeGeneratorConfig = ConfigFromSchema<typeof GeometrySameAttributeGeneratorSchema>;
