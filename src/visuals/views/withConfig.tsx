import React from 'react';
import { ViewRenderPayload } from '../../types/ml-engine.ts';
import { setRandomState } from '../../lib/random.ts';
import { ConfigSchema, ConfigFromSchema } from '../../types/schema.ts';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { ViewValidationError } from '../helpers/validation.ts';

export function withConfig<T extends ConfigSchema>(
    Schema: T,
    Component: React.ComponentType<{ config: ConfigFromSchema<T>, payload: ViewRenderPayload<any> }>
) {
    return function ConfigWrapper(props: { payload: ViewRenderPayload<any> }) {
        const viewId = props.payload.viewId || 'unknown-view';
        const prepared = props.payload.preparedView;
        if (!prepared || prepared.version !== 1 || !prepared.planHash || !prepared.variantHash) {
            throw new ViewValidationError(viewId, 'A current plan-prepared view configuration is required.');
        }
        if (prepared.viewId !== viewId) {
            throw new ViewValidationError(viewId, 'Prepared configuration belongs to a different view.');
        }
        if (!prepared.config || typeof prepared.config !== 'object' || Array.isArray(prepared.config)) {
            throw new ViewValidationError(viewId, 'Prepared view configuration must be an object.');
        }
        setRandomState(prepared.randomState);
        const config = prepared.config as ConfigFromSchema<T>;

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
