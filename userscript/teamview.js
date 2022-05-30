'use strict'
/* globals  */

const gv = require('./galaxyview')
const pb = require('./planetBookmark')
const sp = require('./spioParser')

if (window.location.search.includes('page=galaxy')) {
  gv.init()
  pb.init()
}

sp.init()
