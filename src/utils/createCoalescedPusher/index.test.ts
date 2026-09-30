import { describe, expect, it, vi } from 'vitest';
import { createCoalescedPusher } from '~/utils/createCoalescedPusher';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => {
    resolve = r;
  });
  return { promise, resolve };
};

describe('createCoalescedPusher', () => {
  it('runs a push immediately on the first request', () => {
    const push = vi.fn().mockResolvedValue(undefined);
    const pusher = createCoalescedPusher(push);

    pusher.requestPush();

    expect(push).toHaveBeenCalledTimes(1);
  });

  it('collapses a burst of requests during an in-flight push into one trailing push', async () => {
    const first = deferred<void>();
    const push = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(undefined);
    const pusher = createCoalescedPusher(push);

    pusher.requestPush();
    // These all arrive while the first push is still pending — none of them
    // may start a second, overlapping push.
    pusher.requestPush();
    pusher.requestPush();
    pusher.requestPush();
    expect(push).toHaveBeenCalledTimes(1);

    first.resolve();
    await vi.waitFor(() => expect(push).toHaveBeenCalledTimes(2));

    // No further requests were made after the burst, so it settles there.
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(push).toHaveBeenCalledTimes(2);
  });

  it('runs a fresh push for a request that arrives after the previous one settled', async () => {
    const push = vi.fn().mockResolvedValue(undefined);
    const pusher = createCoalescedPusher(push);

    pusher.requestPush();
    await vi.waitFor(() => expect(push).toHaveBeenCalledTimes(1));

    pusher.requestPush();
    await vi.waitFor(() => expect(push).toHaveBeenCalledTimes(2));
  });

  it('keeps the pusher usable after a push rejects, without an unhandled rejection', async () => {
    const push = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(undefined);
    const pusher = createCoalescedPusher(push);

    pusher.requestPush();
    await vi.waitFor(() => expect(push).toHaveBeenCalledTimes(1));

    pusher.requestPush();
    await vi.waitFor(() => expect(push).toHaveBeenCalledTimes(2));
  });
});
