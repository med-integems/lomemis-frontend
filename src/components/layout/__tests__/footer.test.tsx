import { render, screen } from '@testing-library/react';
import { Footer } from '../footer';

describe('Footer Component', () => {
  it('renders footer with correct content', () => {
    render(<Footer />);
    
    // Check for copyright text
    expect(screen.getByText(/Copyright © \d{4}, LoMEMIS Sierra Leone. All rights reserved./)).toBeInTheDocument();
    
    // Check for INTEGEMS link
    const integemsLink = screen.getByRole('link', { name: /INTEGEMS Limited/i });
    expect(integemsLink).toBeInTheDocument();
    expect(integemsLink).toHaveAttribute('href', 'https://integemsgroup.com');
    expect(integemsLink).toHaveAttribute('target', '_blank');
    expect(integemsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('displays current year dynamically', () => {
    render(<Footer />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`Copyright © ${currentYear}`))).toBeInTheDocument();
  });
});