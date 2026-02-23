export class XSkynetError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message)
    this.name = 'XSkynetError'
  }
}

export class NetworkError extends XSkynetError {
  constructor(message: string) {
    super(`Network error: ${message}`)
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends XSkynetError {
  constructor(path: string) {
    super(`Request timed out: ${path}`)
    this.name = 'TimeoutError'
  }
}
