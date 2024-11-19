var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  topLevel(req, res, next);
});

router.post('/', function(req, res, next) {
  topLevel(req, res, next, req.body);
});

function topLevel(req, res, next, formdata) {
  clearReqAppLocals(req);
  req.app.locals.formdata = formdata;
  if (req.app.locals.db) {
    console.log('Got the database');
    req.app.locals.query = "select * from Faculty;";
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
}


function clearReqAppLocals(req) {
  req.app.locals.query = '';
  req.app.locals.rows = [];
  req.app.locals.schools = [];
  req.app.locals.courses = [];
  req.app.locals.formdata = {};
}

function showIndex(req, res, next) {
  res.render('index', { title: 'Another brick in the SQL',
                        rows: req.app.locals.rows,
                        FacSSN: req.app.locals.formdata.FacSSN,
                        formdata: req.app.locals.formdata
  });
}

module.exports = router;
