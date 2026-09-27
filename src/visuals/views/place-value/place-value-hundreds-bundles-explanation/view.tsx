import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {HundredsBundlesRenderer} from '../hundreds-bundles-renderer.tsx';
import {PlaceValueHundredsBundlesExplanationViewConfig, PlaceValueHundredsBundlesExplanationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueHundredsBundlesExplanationViewConfig;
    payload: ViewRenderPayload<'place-value-hundreds-bundles-explanation'>;
}

export const PlaceValueHundredsBundlesExplanationCore = ({config: _config, payload}: CoreProps) => (
    <HundredsBundlesRenderer
        viewId={payload.viewId}
        data={payload.problem.data}
        isSolutionView={payload.isSolutionView}
        task="explanation"
    />
);

export const PlaceValueHundredsBundlesExplanation = withConfig(
    PlaceValueHundredsBundlesExplanationViewSchema, PlaceValueHundredsBundlesExplanationCore
);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'place-value-hundreds-bundles-explanation'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<PlaceValueHundredsBundlesExplanation payload={payload} />);
        }
    };
}
