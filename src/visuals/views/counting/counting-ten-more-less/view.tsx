import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {CountingPlaceValueOffsetView} from '../counting-place-value-offset-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {CountingTenMoreLessViewConfig, CountingTenMoreLessViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: CountingTenMoreLessViewConfig;
    payload: ViewRenderPayload<'counting-ten-more-less'>;
}

const CountingTenMoreLessCore = ({config: _config, payload}: CoreProps) => (
    <CountingPlaceValueOffsetView
        expectedStepSize={10}
        payload={payload}
        viewId="counting-ten-more-less"
    />
);

export const CountingTenMoreLess = withConfig(CountingTenMoreLessViewSchema, CountingTenMoreLessCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'counting-ten-more-less'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<CountingTenMoreLess payload={payload}/>);
    }
};
