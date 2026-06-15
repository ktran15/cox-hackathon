import { render, screen } from '@testing-library/react-native';

import { GradeBadge } from '../GradeBadge';

describe('GradeBadge', () => {
  it('shows the grade letter and the plain-language label', async () => {
    await render(<GradeBadge grade="A" label="Like new!" />);

    expect(screen.getByText('A')).toBeOnTheScreen();
    expect(screen.getByText('Like new!')).toBeOnTheScreen();
  });

  it('uses the plain-language label for the screen reader, not the letter', async () => {
    await render(<GradeBadge grade="D" label="Too worn to wear again" />);

    expect(
      screen.getByLabelText('Condition: Too worn to wear again'),
    ).toBeOnTheScreen();
  });

  it('falls back to the grade letter when no label is given', async () => {
    await render(<GradeBadge grade="B" />);

    expect(screen.getByLabelText('Condition grade B')).toBeOnTheScreen();
  });
});

