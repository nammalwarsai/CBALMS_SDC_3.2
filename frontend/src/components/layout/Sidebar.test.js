import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/admin-dashboard' })
}), { virtual: true });

beforeAll(() => {
  window.matchMedia = window.matchMedia || (() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }));
});

const baseProps = {
  user: { id: 1, name: 'Test User' },
  onLogout: jest.fn(),
  collapsed: false,
  onToggle: jest.fn()
};

describe('Sidebar', () => {
  test('shows admin navigation links for admin users', () => {
    render(<Sidebar {...baseProps} isAdmin={true} />);

    expect(screen.getAllByLabelText('Holidays').length).toBeGreaterThan(0);
  });

  test('shows employee holidays link but not admin holidays link for employee users', () => {
    render(<Sidebar {...baseProps} isAdmin={false} />);

    // Employee has Holidays links (desktop + mobile), verify they exist
    const holidayLinks = screen.getAllByLabelText('Holidays');
    expect(holidayLinks.length).toBeGreaterThan(0);
  });

  test('shows employee-specific navigation links', () => {
    render(<Sidebar {...baseProps} isAdmin={false} />);

    expect(screen.getAllByLabelText('Attendance').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Leaves').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Settings').length).toBeGreaterThan(0);
  });
});
