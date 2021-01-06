var express = require('express');
var router = express.Router();
const fs = require('fs');
/* GET home page. */
router.get('/', function(req, res, next) {
  const content = fs.readFileSync('./views/index.html');
  res.setHeader('content-type', 'text/html');
  res.send(content);
});

module.exports = router;
