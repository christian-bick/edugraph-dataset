import React from 'react';
import { ViewRenderPayload } from '../../types/ml-engine.ts';
import { extractConfig } from '../../lib/utils.ts';
import { ConfigSchema, ConfigFromSchema } from '../../types/schema.ts';

export function withConfig<T extends ConfigSchema>(
    Schema: T,
    Component: React.ComponentType<{ config: ConfigFromSchema<T>, payload: ViewRenderPayload<any> }>
) {
    return function ConfigWrapper(props: { payload: ViewRenderPayload<any> }) {
        const { config } = extractConfig(Schema, props.payload.labels || []);
        return <Component config={config} payload={props.payload} />;
    };
}
