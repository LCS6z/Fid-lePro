import { renderHook, act } from '@testing-library/react-native';
import { useOffline } from '../hooks/useOffline';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useOffline', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retourne false si le serveur répond', async () => {
    mockFetch.mockResolvedValue({});
    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await Promise.resolve(); // laisse la promesse fetch se résoudre
    });

    expect(result.current).toBe(false);
  });

  it('retourne true si le serveur ne répond pas', async () => {
    mockFetch.mockRejectedValue(new Error('Network Error'));
    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBe(true);
  });

  it('redevient false quand le serveur répond à nouveau', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({});

    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(8000);
      await Promise.resolve();
    });
    expect(result.current).toBe(false);
  });

  it('nettoie l intervalle au démontage', () => {
    mockFetch.mockResolvedValue({});
    const clearSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useOffline());
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
