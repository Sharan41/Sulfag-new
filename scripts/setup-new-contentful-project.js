/**
 * Set up Contentful for Sulfag: import products, add images field, create API key, write .env
 *
 * Option A — use an existing space (recommended if token can't create spaces):
 *   CONTENTFUL_MANAGEMENT_TOKEN=CFPAT-... CONTENTFUL_SPACE_ID=abc123 npm run setup:contentful
 *
 * Option B — create a new space (requires org admin token):
 *   CONTENTFUL_MANAGEMENT_TOKEN=CFPAT-... npm run setup:contentful
 *
 * Get token: https://app.contentful.com/account/profile/cma_tokens
 */

import contentfulManagement from 'contentful-management'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '..')

const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN
const existingSpaceId = process.env.CONTENTFUL_SPACE_ID
const spaceName = process.env.CONTENTFUL_SPACE_NAME || 'Sulfag Products'
const orgId = process.env.CONTENTFUL_ORG_ID
const skipImport = process.env.SKIP_IMPORT === '1'

if (!managementToken) {
  console.error('❌ Missing CONTENTFUL_MANAGEMENT_TOKEN\n')
  console.error('Get a token:')
  console.error('  1. Go to https://app.contentful.com/account/profile/cma_tokens')
  console.error('  2. Generate token → copy CFPAT-...')
  console.error('\nThen run:')
  console.error('  CONTENTFUL_MANAGEMENT_TOKEN=CFPAT-... npm run setup:contentful')
  process.exit(1)
}

const client = contentfulManagement.createClient({ accessToken: managementToken })

async function resolveOrganizationId() {
  if (orgId) return orgId

  const { items } = await client.getOrganizations()
  if (!items.length) {
    throw new Error('No Contentful organizations found on this account.')
  }

  if (items.length === 1) {
    console.log(`📁 Using organization: ${items[0].name}`)
    return items[0].sys.id
  }

  console.log('📁 Available organizations:')
  items.forEach((org) => console.log(`   • ${org.name} (${org.sys.id})`))
  throw new Error('Multiple organizations found. Set CONTENTFUL_ORG_ID and re-run.')
}

async function createSpace(organizationId) {
  console.log(`\n🚀 Creating space "${spaceName}"...`)
  const response = await fetch('https://api.contentful.com/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${managementToken}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'X-Contentful-Organization': organizationId,
    },
    body: JSON.stringify({ name: spaceName }),
  })

  const data = await response.json()
  if (!response.ok) {
    const message = data.message || `Failed to create space (${response.status})`
    console.error('\n❌ Could not create space automatically.')
    console.error(`   ${message}`)
    console.error('\nCreate the space manually, then re-run with your Space ID:')
    console.error('  1. Go to https://app.contentful.com → Create space → Empty space')
    console.error(`  2. Name it "${spaceName}"`)
    console.error('  3. Copy the Space ID from Settings → General settings')
    console.error('  4. Run: CONTENTFUL_MANAGEMENT_TOKEN=CFPAT-... CONTENTFUL_SPACE_ID=your_space_id npm run setup:contentful')
    process.exit(1)
  }

  console.log(`✅ Space created: ${data.sys.id}`)
  return client.getSpace(data.sys.id)
}

async function getSpace(spaceId) {
  console.log(`\n📦 Using existing space: ${spaceId}`)
  try {
    const space = await client.getSpace(spaceId)
    console.log(`✅ Connected to "${space.name}"`)
    return space
  } catch (error) {
    const status = error.status || error.statusCode
    if (status === 401 || status === 403) {
      console.error('\n❌ Your management token cannot access this space.')
      console.error('\nFix option A — generate a token for THIS space:')
      console.error(`  1. Open https://app.contentful.com/spaces/${spaceId}/api/keys`)
      console.error('  2. Content management tokens → Generate personal token')
      console.error('  3. Re-run with the new CFPAT-... token')
      console.error('\nFix option B — use Contentful CLI login (no token needed):')
      console.error('  1. contentful login')
      console.error(`  2. contentful space import --space-id ${spaceId} --content-file products-contentful-import.json`)
      console.error('  3. Get delivery token from Settings → API keys → copy Space ID + Content Delivery token')
      console.error('  4. Add both to .env as VITE_CONTENTFUL_SPACE_ID and VITE_CONTENTFUL_ACCESS_TOKEN')
      process.exit(1)
    }
    throw error
  }
}

async function waitForSpaceReady(spaceId, attempts = 12) {
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const space = await client.getSpace(spaceId)
      await space.getEnvironment('master')
      return space
    } catch {
      console.log(`   Waiting for space to be ready (${i}/${attempts})...`)
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
  throw new Error('Space did not become ready in time.')
}

function importContent(spaceId) {
  const importFile = path.join(projectRoot, 'products-contentful-import.json')
  if (!fs.existsSync(importFile)) {
    throw new Error(`Import file not found: ${importFile}`)
  }

  console.log('\n📦 Importing content model...')
  execSync(
    `contentful space import --space-id "${spaceId}" --content-file "${importFile}" --content-model-only --management-token "${managementToken}"`,
    { stdio: 'inherit', cwd: projectRoot }
  )

  console.log('\n📦 Importing products...')
  execSync(
    `contentful space import --space-id "${spaceId}" --content-file "${importFile}" --skip-content-model --management-token "${managementToken}"`,
    { stdio: 'inherit', cwd: projectRoot }
  )

  console.log('✅ Import complete')
}

async function publishContentTypeAndEntries(spaceId) {
  console.log('\n📢 Publishing content type and entries (required for website)...')
  const space = await client.getSpace(spaceId)
  const environment = await space.getEnvironment('master')

  const contentType = await environment.getContentType('product')
  if (!contentType.sys.publishedVersion) {
    await contentType.publish()
    console.log('   ✅ Published product content type')
  }

  const { items } = await environment.getEntries({ content_type: 'product', limit: 100 })
  let published = 0
  for (const entry of items) {
    if (!entry.isPublished()) {
      await entry.publish()
      published += 1
    }
  }
  console.log(`   ✅ Published ${published} product entries`)
}

async function addImagesField(spaceId) {
  console.log('\n🖼️  Adding optional images field to product content type...')
  execSync(
    `CONTENTFUL_SPACE_ID="${spaceId}" CONTENTFUL_MANAGEMENT_TOKEN="${managementToken}" node "${path.join(__dirname, 'add-product-images-field.js')}"`,
    { stdio: 'inherit', cwd: projectRoot }
  )
}

async function createDeliveryApiKey(space) {
  console.log('\n🔑 Creating Content Delivery API key...')
  const apiKey = await space.createApiKey({ name: 'Sulfag Website' })
  return {
    spaceId: space.sys.id,
    accessToken: apiKey.accessToken,
  }
}

function writeEnvFile({ spaceId, accessToken }) {
  const envPath = path.join(projectRoot, '.env')
  const contents = `# Contentful — generated by scripts/setup-new-contentful-project.js
VITE_CONTENTFUL_SPACE_ID=${spaceId}
VITE_CONTENTFUL_ACCESS_TOKEN=${accessToken}
`
  fs.writeFileSync(envPath, contents, 'utf8')
  console.log(`\n✅ Wrote ${envPath}`)
}

async function testConnection(spaceId, accessToken) {
  const { createClient } = await import('contentful')
  const deliveryClient = createClient({ space: spaceId, accessToken })
  const entries = await deliveryClient.getEntries({ content_type: 'product', limit: 1 })
  console.log(`✅ Delivery API works (${entries.total} products)`)
}

async function main() {
  console.log('🌱 Sulfag Contentful setup\n')

  let space
  if (existingSpaceId) {
    space = await getSpace(existingSpaceId)
  } else {
    const organizationId = await resolveOrganizationId()
    space = await createSpace(organizationId)
  }

  const readySpace = await waitForSpaceReady(space.sys.id)

  if (!skipImport) {
    importContent(readySpace.sys.id)
    await publishContentTypeAndEntries(readySpace.sys.id)
    await addImagesField(readySpace.sys.id)
  }

  const credentials = await createDeliveryApiKey(readySpace)
  writeEnvFile(credentials)
  await testConnection(credentials.spaceId, credentials.accessToken)

  console.log('\n🎉 Contentful project ready!\n')
  console.log(`   Space ID:      ${credentials.spaceId}`)
  console.log(`   Dashboard:     https://app.contentful.com/spaces/${credentials.spaceId}`)
  console.log(`   Products:      https://app.contentful.com/spaces/${credentials.spaceId}/entries`)
  console.log('\nNext steps:')
  console.log('   1. npm run dev          — test locally')
  console.log('   2. Add the same env vars to Render (see RENDER-ENV-VARIABLES-SETUP.md)')
}

main().catch((error) => {
  console.error('\n❌ Setup failed:', error.message || error)
  process.exit(1)
})
