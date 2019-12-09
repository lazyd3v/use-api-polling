# useAPIPolling

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
![](https://github.com/lazyd3v/use-api-polling/workflows/Build/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/faizrr/use-api-polling/badge.svg)](https://coveralls.io/github/faizrr/use-api-polling)
[![Dev Dependencies](https://david-dm.org/faizrr/use-api-polling/dev-status.svg)](https://david-dm.org/faizrr/use-api-polling?type=dev)

Simple react hook for data polling. Executes async function every N seconds, updates state and handles all setTimeout/clearTimeout stuff for you.

### Benefits

- Simple API

- Small size (only **547 bytes**)

- Typescript support

- Will not make additional async function call if previous doesn't complete

## Install

Using npm

```sh
npm install --save use-api-polling
```

Or yarn

```sh
yarn add use-api-polling
```

## Usage

```tsx
import React from 'react'
import useAPIPolling, { APIPollingOptions } from 'use-api-polling'
import API from './api'

type DataType = {
  img: string
  title: string
}

const App = () => {
  const fetchFunc = async () => {
    const cats = await API.getCats()
    return cats
  }

  const options: APIPollingOptions<DataType> = {
    fetchFunc,
    initialState: [],
    delay: 5000
  }
  const data = useAPIPolling(options)

  return <Gallery data={data} />
}
```

## API

### APIPollingOptions&lt;DataType>

| Option name   | Type                     | Required | Description                                                                                                                                                                   |
| ------------- | ------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fetchFunc     | () => Promise<DataType>  | Yes      | Function be called every N seconds. Result of this function will be passed to hooks result                                                                                    |
| initialState  | DataType                 | Yes      | Initial hook result. Will be returned before first fetchFunc                                                                                                                  |
| delay         | number                   | Yes      | Interval for polling in milliseconds                                                                                                                                          |
| onError       | (error, setData) => void | No       | Callback be called after fetchFunc promise fail. setData function is used to change hook result. If option is not provided, initialState will be written after fetchFunc fail |
| updateTrigger | any                      | No       | This variable pass as useEffect's 2nd argument to trigger update. If option is not provided, polling will start on component mount and stop on component unmount              |
