/**
 * Research Agent Example — X-Skynet AI Container
 * 
 * Demonstrates a multi-step research workflow:
 * 1. Search for information (HTTP plugin)
 * 2. Analyze results (Claude plugin)  
 * 3. Generate report (Shell plugin)
 */
import { XSkynetClient } from '@xskynet/sdk-js'

async function main() {
  console.log('X-Skynet Research Agent Example')
  console.log('=================================')
  
  const client = new XSkynetClient({
    baseUrl: process.env['XSKYNET_URL'] ?? 'http://localhost:3847',
    apiKey: process.env['XSKYNET_API_KEY'],
  })

  // Create a research plan
  const plan = await client.createPlan({
    name: 'Research: AI Container Frameworks 2025',
    description: 'Research latest AI agent container frameworks and produce a comparison report',
    tasks: [
      {
        name: 'search',
        steps: [
          { name: 'web-search', executor: 'http', config: { url: 'https://hn.algolia.com/api/v1/search?query=AI+agent+container&tags=story', method: 'GET' } }
        ]
      },
      {
        name: 'analyze',
        steps: [
          { name: 'claude-analysis', executor: 'claude', config: { prompt: 'Analyze the search results and identify key AI container frameworks' } }
        ]
      },
      {
        name: 'report',
        steps: [
          { name: 'generate-report', executor: 'shell', config: { command: 'echo "Report generated at $(date)"' } }
        ]
      }
    ]
  }).catch(() => ({ id: 'demo-plan', name: 'Research Plan (demo mode)' }))

  console.log('Plan created:', (plan as any).name ?? JSON.stringify(plan))
  console.log('\nTo run with a live X-Skynet instance:')
  console.log('  XSKYNET_URL=http://localhost:3847 XSKYNET_API_KEY=your-key pnpm start')
}

main().catch(console.error)
