import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import StructuralForm from '../StructuralForm';

// Mock window.matchMedia for Ant Design Select component
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const defaults = { entityName: '', domain: '', domainId: null as number | null, subDomain: '', scenario: '', attributes: [], relations: [], inheritance: '', valueObjects: [] };

describe('StructuralForm', () => {
  it('renders entity name input', () => {
    render(<StructuralForm data={defaults} onChange={vi.fn()} />);
    const inputs = screen.getAllByDisplayValue('');
    expect(inputs.length).toBeGreaterThanOrEqual(3);
    expect(inputs[0]).toBeInTheDocument();
  });
});
