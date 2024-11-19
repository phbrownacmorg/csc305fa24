var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  clearReqAppLocals(req);
  if (req.app.locals.db) {
    console.log('Got the database');
    req.app.locals.query = "select * from sqlite_master where type='table';";
    req.app.locals.db.all(req.app.locals.query, [], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.rows = rows;
      showIndex(req, res, next); // Has to happen inside the handler
    });
  }
  else {
    showIndex(req, res, next);
  }
});


function clearReqAppLocals(req) {
  req.app.locals.query = '';
  req.app.locals.rows = [];
  req.app.locals.schools = [];
  req.app.locals.courses = [];
}

function showIndex(req, res, next) {
  res.render('index', { title: 'The Wall',
                        rows: req.app.locals.rows,
                        postdata: req.body
  });
}

module.exports = router;
