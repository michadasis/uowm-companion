import { INJECTED_TOKEN_HOOK, parseTokenMessage } from '../login';

describe('parseTokenMessage', () => {
  it('reads the token from a well-formed message', () => {
    expect(parseTokenMessage(JSON.stringify({ type: 'universis-token', token: 'abc' }))).toBe(
      'abc',
    );
  });

  it('ignores a message of another type', () => {
    expect(parseTokenMessage(JSON.stringify({ type: 'something', token: 'abc' }))).toBeNull();
  });

  it('ignores an empty token or missing field', () => {
    expect(parseTokenMessage(JSON.stringify({ type: 'universis-token', token: '' }))).toBeNull();
    expect(parseTokenMessage(JSON.stringify({ type: 'universis-token' }))).toBeNull();
  });

  it('ignores anything that is not JSON', () => {
    expect(parseTokenMessage('not json')).toBeNull();
    expect(parseTokenMessage('[DOM event]')).toBeNull();
  });
});

describe('INJECTED_TOKEN_HOOK', () => {
  it('is a self-contained script ending in a truthy value', () => {
    expect(INJECTED_TOKEN_HOOK.trim().endsWith('true;')).toBe(true);
    expect(INJECTED_TOKEN_HOOK).toContain('universis-token');
  });
});
