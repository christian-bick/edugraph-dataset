import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {KnownFactDerivationView} from '../known-fact-derivation-view.tsx';
import {
    OperationsKnownFactInversionViewConfig,
    OperationsKnownFactInversionViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-known-fact-inversion';

interface CoreProps {
    config: OperationsKnownFactInversionViewConfig;
    payload: ViewRenderPayload<'operations-known-fact-inversion'>;
}

const OperationsKnownFactInversionCore = ({payload}: CoreProps) => (
    <KnownFactDerivationView mode="inversion" payload={payload} viewId={VIEW_ID} />
);

export const OperationsKnownFactInversion = withConfig(
    OperationsKnownFactInversionViewSchema,
    OperationsKnownFactInversionCore
);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'operations-known-fact-inversion'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<OperationsKnownFactInversion payload={payload} />);
        }
    };
}
