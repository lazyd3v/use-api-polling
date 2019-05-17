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

  const fetchData = () =>
    new Promise(resolve => {
      fetchFunc()
        .then(newData => {
          setData(newData)
          resolve()
        })
        .catch(e => {
          if (!onError) {
            setData(initialState)
            resolve()
          } else {
            onError(e, setData)
            resolve()
          }
        })
    })

  const doPolling = () => {
    if (!timerId.current) {
      timerId.current = setTimeout(() => {
        /* tslint:disable no-floating-promises */
        fetchData().then(() => {
          doPolling()
        })
        /* tslint:enable no-floating-promises */
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
