import { render, screen } from '@testing-library/react';
import App from './App';

test('renders calculator display', () => {
  render(<App />);
  const displayElem = screen.getByText(/0/);
  expect(displayElem).toBeInTheDocument();
});

test('renders history panel title', () => {
  render(<App />);
  const historyElem = screen.getByText(/History/i);
  expect(historyElem).toBeInTheDocument();
});
