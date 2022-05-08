const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
  await setTimeout(() => {}, 100)
  res.json({ message: 'hi' })
})

module.exports = router
