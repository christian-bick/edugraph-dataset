import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ErrorBoundary} from './ErrorBoundary.tsx';

describe('ErrorBoundary', () => {
    it('marks diagnostic cards so canonical generation can reject them', () => {
        const boundary = new ErrorBoundary({children: null, viewId: 'test-view'});
        boundary.state = {
            hasError: true,
            error: new Error('broken payload')
        };

        const markup = renderToStaticMarkup(boundary.render());

        expect(markup).toContain('data-view-error="true"');
        expect(markup).toContain('Invalid problem data: broken payload');
    });
});
