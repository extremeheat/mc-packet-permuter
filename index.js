const ProtoDef = require('protodef').ProtoDef
const minecraftData = require('minecraft-data')

/**
 * Generator function that yields permutations of all possible packet encodings
 * @param {string} version - Minecraft version (e.g., '1.16')
 * @param {object} options - Options for permutation
 * @param {string} options.direction - Either 'toClient' or 'toServer' (default: 'toClient')
 * @param {string} options.state - Protocol state like 'play', 'login', etc. (default: 'play')
 * @yields {Array} [packetName, payload, encodedBuffer]
 */
function * permute (version, options = {}) {
  const { direction = 'toClient', state = 'play' } = options

  // Get minecraft data for the version (PC only for now)
  const mcData = minecraftData(version)
  if (mcData.version.type !== 'pc') {
    throw new Error('Only PC version is supported')
  }

  const protocol = mcData.protocol
  if (!protocol) {
    throw new Error(`Protocol data not found for version ${version}`)
  }

  // Get the packet definitions for the specified state and direction
  const stateProtocol = protocol[state]
  if (!stateProtocol) {
    throw new Error(`State '${state}' not found in protocol`)
  }

  const packets = stateProtocol[direction]
  if (!packets || !packets.types) {
    throw new Error(`Direction '${direction}' not found in state '${state}'`)
  }

  // Initialize ProtoDef with types
  const proto = new ProtoDef()
  proto.addTypes(protocol.types)
  proto.addTypes(packets.types)

  // Iterate through all packet types
  for (const [packetName, packetDef] of Object.entries(packets.types)) {
    // Generate permutations for this packet
    yield * permutePacket(proto, packetName, packetDef)
  }
}

/**
 * Generate all permutations for a single packet type
 * @param {ProtoDef} proto - The ProtoDef instance
 * @param {string} packetName - Name of the packet
 * @param {Array} packetDef - Packet definition
 * @yields {Array} [packetName, payload, encodedBuffer]
 */
function * permutePacket (proto, packetName, packetDef) {
  // Parse the packet definition to find switch statements
  const switchFields = findSwitchFields(packetDef)

  if (switchFields.length === 0) {
    // No switch statements, generate a single default permutation
    const payload = generateDefaultPayload(packetDef)
    try {
      const encoded = proto.createPacketBuffer(packetName, payload)
      yield [packetName, payload, encoded]
    } catch (err) {
      // Skip packets that fail to encode with default values
      // console.error(`Failed to encode ${packetName}:`, err.message)
    }
  } else {
    // Generate all combinations of switch branches
    yield * generateSwitchPermutations(proto, packetName, packetDef, switchFields)
  }
}

/**
 * Find all switch fields in a packet definition
 * @param {Array} packetDef - Packet definition
 * @returns {Array} Array of switch field information
 */
function findSwitchFields (packetDef) {
  const switches = []

  if (!Array.isArray(packetDef) || packetDef[0] !== 'container') {
    return switches
  }

  const fields = packetDef[1]
  if (!Array.isArray(fields)) {
    return switches
  }

  for (const field of fields) {
    if (field.type && Array.isArray(field.type) && field.type[0] === 'switch') {
      const switchDef = field.type[1]
      switches.push({
        fieldName: field.name,
        compareTo: switchDef.compareTo,
        fields: switchDef.fields || {},
        defaultValue: switchDef.default
      })
    }
  }

  return switches
}

/**
 * Generate default payload for a packet
 * @param {Array} packetDef - Packet definition
 * @returns {object} Default payload object
 */
function generateDefaultPayload (packetDef) {
  const payload = {}

  if (!Array.isArray(packetDef) || packetDef[0] !== 'container') {
    return payload
  }

  const fields = packetDef[1]
  if (!Array.isArray(fields)) {
    return payload
  }

  for (const field of fields) {
    payload[field.name] = getDefaultValue(field.type)
  }

  return payload
}

/**
 * Get a default value for a type
 * @param {string|Array} type - Type definition
 * @returns {*} Default value
 */
function getDefaultValue (type) {
  if (Array.isArray(type)) {
    if (type[0] === 'switch') {
      return undefined // Will be handled by switch permutation
    }
    if (type[0] === 'array') {
      return []
    }
    if (type[0] === 'container') {
      return generateDefaultPayload(type)
    }
    if (type[0] === 'option') {
      return undefined
    }
    if (type[0] === 'buffer') {
      return Buffer.alloc(0)
    }
  }

  const typeStr = typeof type === 'string' ? type : ''

  if (typeStr.includes('int') || typeStr.includes('i8') || typeStr.includes('i16') ||
      typeStr.includes('i32') || typeStr.includes('i64') || typeStr.includes('u8') ||
      typeStr.includes('u16') || typeStr.includes('u32') || typeStr.includes('u64')) {
    return 0
  }
  if (typeStr.includes('f32') || typeStr.includes('f64') || typeStr === 'float' || typeStr === 'double') {
    return 0.0
  }
  if (typeStr === 'bool' || typeStr === 'boolean') {
    return false
  }
  if (typeStr === 'string' || typeStr === 'pstring') {
    return ''
  }
  if (typeStr === 'UUID') {
    return '00000000-0000-0000-0000-000000000000'
  }
  if (typeStr === 'buffer' || typeStr === 'restBuffer') {
    return Buffer.alloc(0)
  }

  return undefined
}

/**
 * Generate all permutations for packets with switch statements
 * @param {ProtoDef} proto - The ProtoDef instance
 * @param {string} packetName - Name of the packet
 * @param {Array} packetDef - Packet definition
 * @param {Array} switchFields - Array of switch field information
 * @yields {Array} [packetName, payload, encodedBuffer]
 */
function * generateSwitchPermutations (proto, packetName, packetDef, switchFields) {
  // Start with a base payload
  const basePayload = generateDefaultPayload(packetDef)

  // Group switch fields by their compareTo field
  const switchGroups = {}
  for (const switchField of switchFields) {
    const key = switchField.compareTo || 'none'
    if (!switchGroups[key]) {
      switchGroups[key] = []
    }
    switchGroups[key].push(switchField)
  }

  // Generate all combinations of control field values
  const controlCombinations = generateControlFieldCombinations(switchGroups)

  for (const combination of controlCombinations) {
    const payload = { ...basePayload }

    // Apply the control field values
    for (const [controlField, value] of Object.entries(combination)) {
      if (controlField !== 'none') {
        payload[controlField] = value
      }
    }

    try {
      const encoded = proto.createPacketBuffer(packetName, payload)
      yield [packetName, payload, encoded]
    } catch (err) {
      // Skip invalid combinations
      // console.error(`Failed to encode ${packetName} with combination:`, combination, err.message)
    }
  }
}

/**
 * Generate all combinations of control field values
 * @param {Object} switchGroups - Switch fields grouped by compareTo field
 * @returns {Array} Array of combinations
 */
function generateControlFieldCombinations (switchGroups) {
  const combinations = []
  const controlFields = Object.keys(switchGroups)

  if (controlFields.length === 0) {
    return [{}]
  }

  // For each control field, collect all possible values
  const fieldValues = {}
  for (const [controlField, switches] of Object.entries(switchGroups)) {
    const values = new Set()
    
    for (const switchField of switches) {
      // Add all field keys (the switch case values)
      for (const key of Object.keys(switchField.fields)) {
        values.add(parseInt(key))
      }
      // Also add a default value if available
      if (switchField.defaultValue) {
        // Use a value not in the switch cases for default
        values.add(-1) // marker for default case
      }
    }
    
    fieldValues[controlField] = Array.from(values)
  }

  // Generate cartesian product of all control field values
  function cartesian (fields, index = 0, current = {}) {
    if (index >= fields.length) {
      combinations.push({ ...current })
      return
    }

    const field = fields[index]
    const values = fieldValues[field]

    for (const value of values) {
      current[field] = value
      cartesian(fields, index + 1, current)
    }
  }

  cartesian(controlFields)
  return combinations
}

module.exports = { permute }
