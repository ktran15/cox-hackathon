import { render, screen } from '@testing-library/react-native';

import { RouteChip } from '../RouteChip';

describe('RouteChip', () => {
  it.each([
    ['resell', 'Resell'],
    ['donate', 'Donate'],
    ['recycle', 'Recycle'],
  ] as const)('renders the %s route with its sentence-case label', async (route, label) => {
    await render(<RouteChip route={route} />);

    expect(screen.getByText(label)).toBeOnTheScreen();
    expect(screen.getByLabelText(`Route: ${label}`)).toBeOnTheScreen();
  });

  it('honors a label override', async () => {
    await render(<RouteChip route="donate" label="Donated!" />);

    expect(screen.getByText('Donated!')).toBeOnTheScreen();
  });
});
