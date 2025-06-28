import { NextResponse } from 'next/server'
import axios, { AxiosResponse } from 'axios'
import { getAccessToken } from '../../../utils/authTGB'

type Ticker = {
  name: string
  ticker: string
}

type TickerApiResponse = {
  data: {
    tickers: Ticker[]
    pagination: {
      count: number
      page: number
      itemsPerPage: number
    }
  }
}

type TickerResponse = {
  tickers: Ticker[]
  pagination: {
    count: number
    page: number
    itemsPerPage: number
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const { filters, pagination } = body

  if (!pagination) {
    return NextResponse.json(
      { error: 'Pagination is required' },
      { status: 400 }
    )
  }

  const { name, ticker } = filters || {}

  if (!name && !ticker) {
    return NextResponse.json(
      { error: 'Please provide a filter, either name or ticker.' },
      { status: 400 }
    )
  }

  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      console.error('Access token is missing.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fetchTickers = async (filter: {
      name?: string
      ticker?: string
    }): Promise<AxiosResponse<TickerApiResponse>> => {
      return axios.post<TickerApiResponse>(
        'https://public-api.tgbwidget.com/v1/stocks/tickers',
        {
          filters: filter,
          pagination: {
            page: pagination.page || 1,
            itemsPerPage: pagination.itemsPerPage || 50,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const promises: Promise<AxiosResponse<TickerApiResponse>>[] = []
    if (name) {
      promises.push(fetchTickers({ name }))
    }
    if (ticker) {
      promises.push(fetchTickers({ ticker }))
    }

    const results = await Promise.all(promises)

    const tickersSet = new Set<string>()
    const combinedTickers: Ticker[] = []

    results.forEach((response) => {
      response.data.data.tickers.forEach((tickerObj) => {
        const uniqueKey = `${tickerObj.name}-${tickerObj.ticker}`
        if (!tickersSet.has(uniqueKey)) {
          tickersSet.add(uniqueKey)
          combinedTickers.push(tickerObj)
        }
      })
    })

    const responseData: TickerResponse = {
      tickers: combinedTickers,
      pagination: {
        count: combinedTickers.length,
        page: pagination.page,
        itemsPerPage: pagination.itemsPerPage,
      },
    }

    return NextResponse.json({ data: responseData })
  } catch (error: unknown) {
    console.error('Error fetching ticker list:', error)
    let errorMessage = 'Internal Server Error'
    if (axios.isAxiosError(error) && error.response) {
      errorMessage = error.response.data
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
