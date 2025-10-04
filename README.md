# mc-packet-permuter
Generates encoded branch permutations of Minecraft packets

## Overview

This library generates all possible encoded permutations of Minecraft packets by exploring every branch of switch statements in the protocol definition. It uses [minecraft-data](https://github.com/PrismarineJS/minecraft-data) to get protocol information and [protodef](https://github.com/ProtoDef-io/ProtoDef) to encode packets.

## Installation

```bash
npm install mc-packet-permuter
```

## Usage

### Basic Usage

```javascript
const { permute } = require('mc-packet-permuter')

// Generate all packet permutations for Minecraft 1.16
for (const [packetName, payload, encoded] of permute('1.16')) {
  console.log('Packet:', packetName)
  console.log('Payload:', payload)
  console.log('Encoded:', encoded.toString('hex'))
}
```

### With Options

```javascript
const { permute } = require('mc-packet-permuter')

// Generate permutations for server-bound packets
const options = {
  direction: 'toServer', // 'toClient' or 'toServer' (default: 'toClient')
  state: 'play'          // 'handshaking', 'status', 'login', 'play' (default: 'play')
}

for (const [packetName, payload, encoded] of permute('1.16', options)) {
  console.log('Packet:', packetName)
  console.log('Encoded:', encoded.toString('hex'))
}
```

## API

### `permute(version, options)`

Generator function that yields permutations of all possible packet encodings.

**Parameters:**
- `version` (string): Minecraft version (e.g., '1.16', '1.17', '1.18')
- `options` (object, optional):
  - `direction` (string): Either 'toClient' or 'toServer' (default: 'toClient')
  - `state` (string): Protocol state like 'play', 'login', etc. (default: 'play')

**Yields:**
- Array of `[packetName, payload, encodedBuffer]`
  - `packetName` (string): Name of the packet
  - `payload` (object): The packet payload with all fields
  - `encodedBuffer` (Buffer): The encoded packet as a Buffer

**Note:** Only PC (Java Edition) versions are currently supported.

## How It Works

The library analyzes the protocol definition from minecraft-data and:

1. Identifies packets with switch statements (conditional fields)
2. Generates all possible combinations of switch branch values
3. Creates a payload for each combination
4. Encodes the payload using protodef
5. Returns the packet name, payload, and encoded buffer for each permutation

For packets without switch statements, it generates a single permutation with default values.

## Example

See [example.js](example.js) for a complete working example.

## License

ISC
