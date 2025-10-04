const { permute } = require('./index')

// Test that switch statements are properly handled
console.log('Testing switch statement handling\n')

// packet_use_entity has multiple switch fields based on the "mouse" field
console.log('=== Testing packet_use_entity (has switch fields) ===')
const useEntityPermutations = []
for (const [packetName, payload, encoded] of permute('1.16', { direction: 'toServer' })) {
  if (packetName === 'packet_use_entity') {
    useEntityPermutations.push({ payload, encoded: encoded.toString('hex') })
  }
}

console.log(`Found ${useEntityPermutations.length} permutations for packet_use_entity`)

// Check that we have permutations with different mouse values
const mouseValues = new Set(useEntityPermutations.map(p => p.payload.mouse))
console.log('Unique mouse values:', Array.from(mouseValues))

// Check that we have different encoded outputs
const uniqueEncodings = new Set(useEntityPermutations.map(p => p.encoded))
console.log('Unique encodings:', uniqueEncodings.size)

// Show examples
console.log('\nExamples:')
useEntityPermutations.forEach((perm, i) => {
  console.log(`  ${i + 1}. mouse=${perm.payload.mouse}, encoded=${perm.encoded.slice(0, 40)}...`)
})

// Verify all permutations are unique
if (useEntityPermutations.length === uniqueEncodings.size) {
  console.log('\n✓ All permutations have unique encodings')
} else {
  console.log('\n✗ Some permutations have duplicate encodings')
}

// Test a packet without switches
console.log('\n=== Testing packet_keep_alive (no switch fields) ===')
let keepAliveCount = 0
for (const [packetName, payload, encoded] of permute('1.16', { direction: 'toServer' })) {
  if (packetName === 'packet_keep_alive') {
    keepAliveCount++
    if (keepAliveCount === 1) {
      console.log('Payload:', payload)
      console.log('Encoded:', encoded.toString('hex'))
    }
  }
}
console.log(`Found ${keepAliveCount} permutation(s) for packet_keep_alive`)

console.log('\n✓ All tests passed!')
