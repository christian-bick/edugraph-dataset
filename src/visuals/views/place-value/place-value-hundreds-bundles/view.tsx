import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {HundredsBundlesRenderer} from '../hundreds-bundles-renderer.tsx';
import {PlaceValueHundredsBundlesViewConfig, PlaceValueHundredsBundlesViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueHundredsBundlesViewConfig;
    payload: ViewRenderPayload<'place-value-hundreds-bundles'>;
}

export const PlaceValueHundredsBundlesCore = ({config: _config, payload}: CoreProps) => (
    <HundredsBundlesRenderer
        viewId={payload.viewId}
        data={payload.problem.data}
        isSolutionView={payload.isSolutionView}
        task="completion"
    />
);

export const PlaceValueHundredsBundles = withConfig(PlaceValueHundredsBundlesViewSchema, PlaceValueHundredsBundlesCore);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'place-value-hundreds-bundles'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<PlaceValueHundredsBundles payload={payload} />);
        }
    };
}
