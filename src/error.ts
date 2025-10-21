export class HonoResponseError<TData, TStatus, TFormat> extends Error {
  readonly status: TStatus
  readonly data: TData
  readonly format: TFormat

  constructor(response: { status: TStatus; data: TData; format: TFormat }) {
    super(JSON.stringify(response))
    this.name = 'HonoResponseError'
    this.status = response.status
    this.data = response.data
    this.format = response.format
  }
}

export function isHonoResponseError<T>(
  error: T
): error is Extract<T, HonoResponseError<any, any, any>> {
  return error instanceof Error ? error.name === HonoResponseError.name : false
}
