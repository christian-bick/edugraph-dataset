import type {GeneratorCompatibilityRule} from './compatibility.ts';
import type {ConfigSchema} from './schema.ts';
import type {ModuleSpec} from './module-spec.ts';

export interface GeneratorSpec<TSchema extends ConfigSchema = ConfigSchema> extends ModuleSpec<TSchema> {
    generatorId: string;
    /** Pure label constraints on this generator's configuration choices. */
    compatibility?: readonly GeneratorCompatibilityRule[];
}
