import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {KnownFactDerivationView} from '../known-fact-derivation-view.tsx';
import {
    OperationsKnownFactDerivationViewConfig,
    OperationsKnownFactDerivationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-known-fact-derivation';

interface CoreProps {
    config: OperationsKnownFactDerivationViewConfig;
    payload: ViewRenderPayload<'operations-known-fact-derivation'>;
}

const OperationsKnownFactDerivationCore = ({payload}: CoreProps) => (
    <KnownFactDerivationView mode="understanding" payload={payload} viewId={VIEW_ID} />
);

export const OperationsKnownFactDerivation = withConfig(
    OperationsKnownFactDerivationViewSchema,
    OperationsKnownFactDerivationCore
);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'operations-known-fact-derivation'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<OperationsKnownFactDerivation payload={payload} />);
        }
    };
}
