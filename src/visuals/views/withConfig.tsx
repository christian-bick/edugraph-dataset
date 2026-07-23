import React from 'react';
import { ViewRenderPayload } from '../../types/ml-engine.ts';
import { extractConfig } from '../../lib/utils.ts';
import { setSeed } from '../../lib/random.ts';
import { ConfigSchema, ConfigFromSchema } from '../../types/schema.ts';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { ViewValidationError } from '../helpers/validation.ts';

export function withConfig<T extends ConfigSchema>(
    Schema: T,
    Component: React.ComponentType<{ config: ConfigFromSchema<T>, payload: ViewRenderPayload<any> }>
) {
    return function ConfigWrapper(props: { payload: ViewRenderPayload<any> }) {
        // Reset the global PRNG from the sample's render seed so config
        // resolution (and any downstream draws) never depend on render order
        setSeed(props.payload.seed);
        const { config } = extractConfig(Schema, props.payload.labels || []);
        const viewId = props.payload.viewId || 'unknown-view';

        // Enforce parameter validation as a safeguard against coding errors or misusage
        for (const key in Schema) {
            if (config[key] === undefined || config[key] === null) {
                throw new ViewValidationError(viewId, `Resolved configuration parameter "${key}" is missing.`);
            }
        }

        return (
            <ErrorBoundary viewId={viewId}>
                <Component config={config} payload={props.payload} />
            </ErrorBoundary>
        );
    };
}
