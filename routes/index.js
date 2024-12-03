var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  clearReqAppLocals(req);
  topLevel(req, res, next);
});

router.post('/', function(req, res, next) {
  clearReqAppLocals(req);
  req.app.locals.formdata = req.body;
  topLevel(req, res, next, req.body);
});

/*
 * Initial function.  Performs a query on the database, attaches the result
 * to req.app.locals, and passes control to the next query.
 */
function topLevel(req, res, next) {
  if (req.app.locals.formdata) {
    console.log('Form data: ' + JSON.stringify(req.app.locals.formdata));
  }
  else { console.log('No form data'); }
  
  if (req.app.locals.db) {
    console.log('Got the database');
    parameterizedQuery(req, res, next); // Has to happen inside the handler
  }
  else {
    showIndex(req, res, next);
  }
}


function clearReqAppLocals(req) {
  req.app.locals.query = '';
  req.app.locals.rows = [];
  req.app.locals.FacSSN = '';
  req.app.locals.paramQuery = '';
  req.app.locals.courses = [];
  req.app.locals.formdata = {};
}

/*
 * Performs a query on the database, using form data to parameterize the query.
 */
function parameterizedQuery(req, res, next) {
  if (req.app.locals.formdata) {
    if (req.app.locals.formdata.FacSSN) { // The input came from the parameterized-query form
      // Normalize the SSN to have dashes
      req.app.locals.FacSSN = SSN_with_dashes(req.app.locals.formdata.FacSSN);
      console.log('FacSSN: ' + req.app.locals.FacSSN);
      // Set the version for the query *not* to have dashes, since that's what's in the database.
      let querySSN = req.app.locals.formdata.FacSSN.replaceAll('-', '');
      // The query contains "?" where the parameters are to be inserted.  The
      // second argument to db.all() is an array of parameter values to fill in
      // where the query has a "?".  See 
      // https://github.com/TryGhost/node-sqlite3/wiki/API#runsql--param---callback
      // for more  details.
      // This query could also be constructed as a complete string (with no "?" and
      // querySSN already substituted in) in Javascript.  In that case, the second
      // argument to db.all() would just be an empty array.
      let paramQuery = "select * from Offering where FacSSN = ?"
      req.app.locals.paramQuery = paramQuery;
      req.app.locals.db.all(paramQuery, [querySSN], 
                            (err, rows) => {
        if (err) {
          throw err;
        }
        req.app.locals.courses = rows; // Different name from the last time, to keep
                                      // responses to different queries separate
        queryFacTable(req, res, next); // Has to happen inside the handler
      });
    }
    else { // Not the parameterized-query form.  Try the insert query.
      runInsertQuery(req, res, next);
    }
  }
  else {
    queryFacTable(req, res, next);
  }
}

function runInsertQuery(req, res, next) {
  if (req.app.locals.formdata) {
    if (req.app.locals.formdata.FacID) {
      console.log('Inserting...');
      // Parameter values on steroids here...
      let insertQuery = 'insert into Faculty values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
      let insertCallback = function (err) {
        if (err) {
          throw err;
        }
        queryFacTable(req, res, next);
      };

      req.app.locals.db.run(insertQuery, [req.app.locals.formdata.FacID.replaceAll('-', ''),
                                          req.app.locals.formdata.FacFirstName,
                                          req.app.locals.formdata.FacLastName,
                                          req.app.locals.formdata.FacCity,
                                          req.app.locals.formdata.FacState,
                                          req.app.locals.formdata.FacDept,
                                          req.app.locals.formdata.FacRank,
                                          req.app.locals.formdata.FacSalary,
                                          req.app.locals.formdata.FacSupervisor.replaceAll(' ', ''),
                                          (new Date()).toISOString().substring(0,10),
                                          req.app.locals.formdata.FacZip.replaceAll('-', '')],
                            insertCallback);
    }
    else { // No insert query
      queryFacTable(req, res, next);
    }
  }
  else { // No formdata (should never happen)
    queryFacTable(req, res, next);
  }
}

/*
 * Takes a string and ensures that the fourth and seventh characters are hyphens.
 * If they already are, returns the string unchanged.
 */
function SSN_with_dashes(ssn) {
  if (ssn.at(3) != '-') {
    ssn = ssn.slice(0, 3) + '-' + ssn.slice(3);
  }
  if (ssn.at(6) != '-') {
    ssn = ssn.slice(0, 6) + '-' + ssn.slice(6);
  }
  return ssn;
}


function queryFacTable(req, res, next) {
  if (req.app.locals.db) {
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

function showIndex(req, res, next) {
  res.render('index', { title: 'Another brick in the SQL',
                        query: req.app.locals.query,
                        rows: req.app.locals.rows,
                        FacSSN: req.app.locals.FacSSN,
                        paramQuery: req.app.locals.paramQuery,
                        courses: req.app.locals.courses,
                        formdata: req.app.locals.formdata
  });
}

module.exports = router;
