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
    fetchFunc = jest.fn().mockImplementation(() => Promise.resolve({ foo: 'updated' }))
    opts = {
      fetchFunc,
      initialState: { foo: 'initial' },
      delay: DELAY_TIMEOUT
    }
  })
  afterEach(() => {
    // TODO: remove any casting
    ;(fetchFunc as any).mockReset()
  })

  describe('fires fetch function', () => {
    it('on mount', () => {
      const { unmount } = renderHook(() => useAPIPolling(opts))
      expect(fetchFunc).toHaveBeenCalled()
      unmount()
    })

    it('every N milliseconds', async () => {
      const { unmount, waitForNextUpdate } = renderHook(() => useAPIPolling(opts))
      await sleep(DELAY_TIMEOUT)
      await waitForNextUpdate()
      expect(fetchFunc).toHaveBeenCalledTimes(2)
      unmount()
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
      const onError = jest.fn()
      fetchFunc = jest.fn().mockRejectedValueOnce({ foo: 'rejected' })

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

    it.todo('stops fetch function call after updateTrigger change')
    it.todo('fires new fetch function call after updateTrigger change')
  })

  describe('on unmount', () => {
    it('stops fetch function call after unmount', async () => {
      const { waitForNextUpdate, unmount } = renderHook(() => useAPIPolling(opts))
      await waitForNextUpdate()
      await sleep(DELAY_TIMEOUT)
      await waitForNextUpdate()
      unmount()

      await sleep(DELAY_TIMEOUT * 5)

      expect(fetchFunc).toBeCalledTimes(2)
    })
  })
})
