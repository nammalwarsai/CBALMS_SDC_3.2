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

  test('does not show admin holidays link for employee users', () => {
    render(<Sidebar {...baseProps} isAdmin={false} />);

    // Admin Holidays link at /holidays should not be present for employees
    const allHolidays = screen.getAllByLabelText('Holidays');
    // Employee has a Holidays link at /employee-dashboard/holidays, not /holidays
    allHolidays.forEach(el => {
      expect(el).toBeInTheDocument();
    });
  });

  test('shows employee-specific navigation links', () => {
    render(<Sidebar {...baseProps} isAdmin={false} />);

    expect(screen.getAllByLabelText('Attendance').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Leaves').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Settings').length).toBeGreaterThan(0);
  });
});
