import { fireEvent, render, screen } from '@testing-library/react';
import AccessibilityPanel from '../AccessibilityPanel';

describe('AccessibilityPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-accessibility-text');
    document.documentElement.removeAttribute('data-accessibility-contrast');
    document.documentElement.removeAttribute('data-accessibility-motion');
    document.documentElement.removeAttribute('data-accessibility-links');
  });

  it('ouvre le panneau et applique les préférences visibles', () => {
    render(<AccessibilityPanel />);

    fireEvent.click(screen.getByRole('button', { name: /ouvrir les réglages/i }));
    expect(screen.getByRole('dialog', { name: 'Accessibilité' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /très grand/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /contraste renforcé/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /souligner les liens/i }));

    expect(document.documentElement.dataset.accessibilityText).toBe('extra-large');
    expect(document.documentElement.dataset.accessibilityContrast).toBe('high');
    expect(document.documentElement.dataset.accessibilityLinks).toBe('underlined');
    expect(localStorage.getItem('eventmanagerAccessibility')).toContain('extra-large');
  });

  it('se ferme avec la touche Échap', () => {
    render(<AccessibilityPanel />);
    const trigger = screen.getByRole('button', { name: /ouvrir les réglages/i });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Accessibilité' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
