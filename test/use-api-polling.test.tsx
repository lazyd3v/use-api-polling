import { renderHook, act } from 'react-hooks-testing-library'

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
    fetchFunc = jest.fn().mockResolvedValue({ foo: 'updated' })
    opts = {
      fetchFunc,
      initialState: { foo: 'initial' },
      delay: DELAY_TIMEOUT
    }
  })

  describe('fires fetch function', () => {
    it('on mount', () => {
      renderHook(() => useAPIPolling(opts))
      expect(fetchFunc).toHaveBeenCalled()
    })

    it('every N milliseconds', async () => {
      const { waitForNextUpdate } = renderHook(() => useAPIPolling(opts))
      await waitForNextUpdate()
      await waitForNextUpdate()
      expect(fetchFunc).toHaveBeenCalledTimes(2)
    })
  })

  describe('returns', () => {
    it('initialState on mount', () => {
      const { result, unmount } = renderHook(() => useAPIPolling(opts))
      expect(result.current).toEqual(opts.initialState)
      unmount()
    })

    it('fetch result after success fetch result', async () => {
      const { result, waitForNextUpdate, unmount } = renderHook(() => useAPIPolling(opts))
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
      const { result, waitForNextUpdate } = renderHook(() => useAPIPolling(opts))
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
      const { waitForNextUpdate } = renderHook(() => useAPIPolling(opts))
      await waitForNextUpdate()
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('updateTrigger provided', () => {
    // this feature works but because of problems with hooks testing
    // I cant cover this case at the moment
    let oldFetch: () => Promise<DataType>
    let newFetch: () => Promise<DataType>
    beforeEach(async () => {
      oldFetch = opts.fetchFunc
      opts = {
        ...opts,
        updateTrigger: 'foo'
      }
      const { waitForNextUpdate, rerender } = renderHook(useAPIPolling, { initialProps: opts })
      await waitForNextUpdate()
      await waitForNextUpdate()

      newFetch = jest
        .fn()
        .mockResolvedValueOnce({ foo: 'ironman' })
        .mockResolvedValueOnce({ foo: 'superman' })
      opts = {
        ...opts,
        fetchFunc: newFetch,
        updateTrigger: 'bar'
      }
      rerender(opts)

      await waitForNextUpdate()
      await waitForNextUpdate()
    })

    it('stops fetch function call after updateTrigger change', () => {
      expect(oldFetch).toBeCalledTimes(2)
    })

    it('fires new fetch function call after updateTrigger change', () => {
      expect(newFetch).toBeCalledTimes(2)
    })
  })

  describe('on unmount', () => {
    it('stops fetch function call after unmount', async () => {
      const { waitForNextUpdate, unmount } = renderHook(() => useAPIPolling(opts))
      await waitForNextUpdate()
      await waitForNextUpdate()
      unmount()

      await sleep(DELAY_TIMEOUT * 5)

      expect(fetchFunc).toBeCalledTimes(2)
    })
  })
})
