import { render, screen } from '@testing-library/react';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/common/ThemeToggle';

test('renders theme toggle button', () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
  const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i });
  expect(toggleButton).toBeInTheDocument();
});
