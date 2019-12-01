import { renderHook, act } from '@testing-library/react-hooks'

import useAPIPolling, { APIPollingOptions } from '../src/use-api-polling'

// TODO: remove this const
// can't make jest.useFakeTimers work
const DELAY_TIMEOUT = 100

type DataType = {
  foo: string
}

const sleep = (m: number) => new Promise(r => setTimeout(r, m))

describe('useAPIPolling', () => {
  let fetchFunc: () => Promise<DataType>
  let opts: APIPollingOptions<DataType>
  beforeEach(() => {
    fetchFunc = jest
      .fn()
      .mockResolvedValue({ foo: 'default' })
      .mockResolvedValueOnce({ foo: 'updated' })
      .mockResolvedValueOnce({ foo: 'updated2' })
      .mockResolvedValueOnce({ foo: 'updated3' })
    opts = {
      fetchFunc,
      initialState: { foo: 'initial' },
      delay: DELAY_TIMEOUT
    }
  })

  describe('fires fetch function', () => {
    it('on mount', () => {
      renderHook(useAPIPolling, {
        initialProps: opts
      })
      expect(fetchFunc).toHaveBeenCalled()
    })

    it('every N milliseconds', async () => {
      const { waitForNextUpdate, result } = renderHook(useAPIPolling, {
        initialProps: opts
      })
      await waitForNextUpdate()
      await waitForNextUpdate()
      await waitForNextUpdate()

      expect(fetchFunc).toHaveBeenCalledTimes(3)
      expect(result.current).toEqual({ foo: 'updated3' })
    })
  })

  describe('returns', () => {
    it('initialState on mount', () => {
      const { result, unmount } = renderHook(useAPIPolling, {
        initialProps: opts
      })
      expect(result.current).toEqual(opts.initialState)
      unmount()
    })

    it('fetch result after success fetch result', async () => {
      const { result, waitForNextUpdate, unmount } = renderHook(useAPIPolling, {
        initialProps: opts
      })
      await waitForNextUpdate()
      expect(result.current).toEqual({ foo: 'updated' })
      unmount()
    })

    it('initialState after error fetch result by default', async () => {
      fetchFunc = jest
        .fn()
        .mockResolvedValueOnce({ foo: 'updated' })
        .mockRejectedValueOnce({ foo: 'rejected' })

      opts = {
        ...opts,
        fetchFunc
      }
      const { result, waitForNextUpdate } = renderHook(useAPIPolling, {
        initialProps: opts
      })
      await waitForNextUpdate()
      expect(result.current).toEqual({ foo: 'updated' })
      await waitForNextUpdate()
      expect(result.current).toEqual(opts.initialState)
    })
  })

  describe('onError provided', () => {
    it('fires onError callback after error fetch result', async () => {
      const onError = jest.fn().mockImplementation((e, setData) => {
        setData({ foo: 'my error handling' })
      })
      fetchFunc = jest.fn().mockRejectedValue({ foo: 'rejected' })

      opts = {
        ...opts,
        fetchFunc,
        onError
      }
      const { waitForNextUpdate } = renderHook(useAPIPolling, {
        initialProps: opts
      })
      await waitForNextUpdate()
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('updateTrigger provided', () => {
    let oldFetch: () => Promise<DataType>
    let oldOpts: any = {}
    let newFetch: () => Promise<DataType>
    let newOpts: any = {}

    beforeEach(() => {
      oldFetch = jest
        .fn()
        .mockResolvedValue({ foo: 'default' })
        .mockResolvedValueOnce({ foo: 'one' })
        .mockResolvedValueOnce({ foo: 'two' })
      oldOpts = {
        ...opts,
        fetchFunc: oldFetch,
        updateTrigger: 'foo'
      }
      newFetch = jest
        .fn()
        .mockResolvedValue({ foo: 'default' })
        .mockResolvedValueOnce({ foo: 'three' })
        .mockResolvedValueOnce({ foo: 'four' })
      newOpts = {
        ...opts,
        fetchFunc: newFetch,
        updateTrigger: 'bar'
      }
    })

    it('does not return old fetch value after updateTrigger change', async () => {
      const { waitForNextUpdate, result, rerender } = renderHook(useAPIPolling, {
        initialProps: oldOpts
      })
      await waitForNextUpdate()
      expect(result.current).toEqual({ foo: 'one' })
      await waitForNextUpdate()
      expect(result.current).toEqual({ foo: 'two' })

      rerender(newOpts)
      await waitForNextUpdate()
      expect(result.current).toEqual({ foo: 'three' })
      await waitForNextUpdate()
      expect(result.current).toEqual({ foo: 'four' })
    })
  })

  describe('on unmount', () => {
    it('stops fetch function call after unmount', async () => {
      const { waitForNextUpdate, unmount } = renderHook(useAPIPolling, {
        initialProps: opts
      })
      await waitForNextUpdate()
      await waitForNextUpdate()
      unmount()

      await sleep(DELAY_TIMEOUT * 5)

      expect(fetchFunc).toBeCalledTimes(2)
    })
  })
})
