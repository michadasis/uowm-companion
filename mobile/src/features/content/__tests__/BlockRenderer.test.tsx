import { render, screen, userEvent } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';

import { sampleBlocks } from '../__fixtures__/blocks';
import { BlockRenderer } from '../BlockRenderer';
import type { Block } from '../schema';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(() => Promise.resolve()) }));

const renderBlocks = async (blocks: Block[], onLinkPress = jest.fn()) => {
  await render(<BlockRenderer blocks={blocks} onLinkPress={onLinkPress} />);
  return { onLinkPress };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BlockRenderer', () => {
  it('renders every block type from the fixture', async () => {
    await renderBlocks(sampleBlocks);

    expect(screen.getByRole('header', { name: /Πρόγραμμα εξετάσεων/ })).toBeOnTheScreen();
    expect(screen.getByText(/υποχρεωτική/)).toBeOnTheScreen();
    expect(screen.getByText('Πρώτο')).toBeOnTheScreen();
    expect(screen.getByText('Μια σημαντική σημείωση.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Αφίσα')).toBeOnTheScreen();
  });

  it('numbers an ordered list & bullets an unordered one', async () => {
    await renderBlocks([
      { type: 'list', ordered: false, items: [[{ text: 'α' }]] },
      { type: 'list', ordered: true, items: [[{ text: 'β' }]] },
    ]);

    expect(screen.getByText('•')).toBeOnTheScreen();
    expect(screen.getByText('1.')).toBeOnTheScreen();
  });

  it('reports a tapped inline link instead of opening it itself', async () => {
    const user = userEvent.setup();
    const { onLinkPress } = await renderBlocks([
      {
        type: 'paragraph',
        content: [{ text: 'τον οδηγό', href: 'https://cs.uowm.gr/odigos/' }],
      },
    ]);

    await user.press(screen.getByText('τον οδηγό'));

    expect(onLinkPress).toHaveBeenCalledWith('https://cs.uowm.gr/odigos/');
  });

  it('shows a table with its header & cells', async () => {
    await renderBlocks([
      {
        type: 'table',
        header: [[{ text: 'Μάθημα' }], [{ text: 'Αίθουσα' }]],
        rows: [[[{ text: 'Αλγόριθμοι' }], [{ text: 'Α2' }]]],
      },
    ]);

    expect(screen.getByText('Μάθημα')).toBeOnTheScreen();
    expect(screen.getByText('Αλγόριθμοι')).toBeOnTheScreen();
    expect(screen.getByText('Α2')).toBeOnTheScreen();
  });

  it('opens an attachment in the in-app browser', async () => {
    const user = userEvent.setup();
    await renderBlocks([
      { type: 'attachment', name: 'Πρόγραμμα', href: 'https://cs.uowm.gr/a.pdf', format: 'pdf' },
    ]);

    await user.press(screen.getByRole('link', { name: 'Πρόγραμμα' }));

    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://cs.uowm.gr/a.pdf');
  });
});
