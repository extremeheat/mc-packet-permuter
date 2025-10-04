const { permute } = require('./index')

// Example usage of the permute function
console.log('Testing mc-packet-permuter\n')

// Test with Minecraft 1.16
const version = '1.16'
console.log(`Generating packet permutations for Minecraft ${version}...`)

let count = 0
let examplesPrinted = 0
const maxExamples = 5

for (const [packetName, payload, encoded] of permute(version)) {
  count++
  
  // Print first few examples
  if (examplesPrinted < maxExamples) {
    console.log(`\n[${count}] Packet: ${packetName}`)
    console.log('  Payload:', JSON.stringify(payload, null, 2).slice(0, 200))
    console.log('  Encoded:', encoded.toString('hex').slice(0, 60), '...')
    examplesPrinted++
  }
}

console.log(`\nTotal permutations generated: ${count}`)
