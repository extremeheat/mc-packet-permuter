const { permute } = require('./index')

console.log('=== Advanced Examples of mc-packet-permuter ===\n')

// Example 1: Count permutations by state
console.log('Example 1: Count permutations by protocol state')
console.log('------------------------------------------------')
const states = ['handshaking', 'status', 'login', 'play']
states.forEach(state => {
  let count = 0
  for (const _ of permute('1.16', { state, direction: 'toServer' })) {
    count++
  }
  console.log(`  ${state}: ${count} permutations`)
})

// Example 2: Compare client and server directions
console.log('\nExample 2: Compare toClient vs toServer packets')
console.log('------------------------------------------------')
let clientCount = 0
let serverCount = 0

for (const _ of permute('1.16', { direction: 'toClient' })) {
  clientCount++
}

for (const _ of permute('1.16', { direction: 'toServer' })) {
  serverCount++
}

console.log(`  toClient: ${clientCount} permutations`)
console.log(`  toServer: ${serverCount} permutations`)

// Example 3: Find packets with multiple permutations (switch statements)
console.log('\nExample 3: Find packets with switch statements')
console.log('------------------------------------------------')
const packetCounts = {}

for (const [packetName] of permute('1.16', { direction: 'toServer' })) {
  packetCounts[packetName] = (packetCounts[packetName] || 0) + 1
}

const packetsWithSwitches = Object.entries(packetCounts)
  .filter(([_, count]) => count > 1)
  .sort((a, b) => b[1] - a[1])

console.log('  Packets with multiple permutations:')
packetsWithSwitches.forEach(([name, count]) => {
  console.log(`    - ${name}: ${count} permutations`)
})

// Example 4: Analyze a specific packet
console.log('\nExample 4: Analyze packet_use_entity permutations')
console.log('------------------------------------------------')
for (const [packetName, payload, encoded] of permute('1.16', { direction: 'toServer' })) {
  if (packetName === 'packet_use_entity') {
    console.log('  Payload:', JSON.stringify(payload))
    console.log('  Encoded size:', encoded.length, 'bytes')
    console.log('  Encoded hex:', encoded.toString('hex'))
    console.log()
  }
}

// Example 5: Test multiple versions
console.log('Example 5: Compare different Minecraft versions')
console.log('------------------------------------------------')
const versions = ['1.16', '1.17', '1.18', '1.19']
versions.forEach(version => {
  try {
    let count = 0
    for (const _ of permute(version, { direction: 'toServer' })) {
      count++
    }
    console.log(`  Minecraft ${version}: ${count} permutations`)
  } catch (err) {
    console.log(`  Minecraft ${version}: Not available (${err.message})`)
  }
})

console.log('\n✓ Examples completed!')
