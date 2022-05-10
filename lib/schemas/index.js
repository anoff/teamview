const ajv = require('ajv')()
const schema_user = require('./schema_user.json')
const validate = ajv.getSchema('https://example.com/user.json') ||
              ajv.compile(schema_user)

const definitions = [
  {}
]
