import type {ViewCompatibilityRule} from './compatibility.ts';
import type {ConfigSchema} from './schema.ts';
import type {ModuleSpec} from './module-spec.ts';

export interface ViewSpec<TSchema extends ConfigSchema = ConfigSchema> extends ModuleSpec<TSchema> {
    viewId: string;
    /** Pure semantic constraints; generator parameter names and payloads are unavailable. */
    compatibility?: readonly ViewCompatibilityRule[];
}
