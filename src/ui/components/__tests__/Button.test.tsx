import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../Button';

describe('Button', () => {
  it('renders its label and fires onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Add a garment" onPress={onPress} />);

    fireEvent.press(screen.getByText('Add a garment'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes a button role and accessible label', async () => {
    await render(<Button label="Donate it" onPress={() => undefined} />);

    const button = screen.getByRole('button', { name: 'Donate it' });

    expect(button).toBeOnTheScreen();
  });

  it('does not fire onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Add a garment" onPress={onPress} disabled />);

    fireEvent.press(screen.getByText('Add a garment'));

    expect(onPress).not.toHaveBeenCalled();
  });
});

