import { useState, useEffect, useRef, Dispatch } from 'react'

export type APIPollingOptions<DataType> = {
  fetchFunc: () => Promise<DataType>
  initialState: DataType
  delay: number
  onError?: (e: Error, setData?: Dispatch<any>) => void
  updateTrigger?: any
}

function useAPIPolling<DataType>(opts: APIPollingOptions<DataType>): DataType {
  const { initialState, fetchFunc, delay, onError, updateTrigger } = opts

  const timerId = useRef<any>()
  const [data, setData] = useState(initialState)

  const fetchData = async () => {
    try {
      const newData = await fetchFunc()
      setData(newData)
    } catch (e) {
      if (!onError) {
        setData(initialState)
      } else {
        onError(e, setData)
      }
    }
  }

  const doPolling = () => {
    if (!timerId.current) {
      timerId.current = setTimeout(async () => {
        await fetchData()
        doPolling()
      }, delay)
    }
  }

  const stopPolling = () => {
    clearTimeout(timerId.current)
    timerId.current = null
  }

  useEffect(
    () => {
      /* tslint:disable no-floating-promises */
      fetchData().then(() => {
        doPolling()
      })
      /* tslint:enable */

      return stopPolling
    },
    updateTrigger ? [updateTrigger] : []
  )

  return data
}

export default useAPIPolling
