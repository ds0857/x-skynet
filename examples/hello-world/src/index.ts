import { XSkynetClient } from '@xskynet/sdk-js'

async function main() {
  console.log('X-Skynet Hello World — AI Container Framework')
  const client = new XSkynetClient({
    baseUrl: process.env['XSKYNET_URL'] ?? 'http://localhost:3847',
    apiKey: process.env['XSKYNET_API_KEY'],
  })
  console.log('Client ready:', client.constructor.name)
  console.log('Set XSKYNET_URL to connect to your X-Skynet instance.')
}

main().catch(console.error)
