var fs = require("fs");
var initSqlJs = require('./sql-wasm.js');

initSqlJs().then(function (SQL) {
  var db = new SQL.Database();
  const query =
    // Run a query without reading the results
    db.run("CREATE TABLE test (col1, col2);");
  // Insert two rows: (1,111) and (2,222)
  db.run("INSERT INTO test VALUES (?,?), (?,?)", [1, 111, 2, 222]);

  var data = db.export();
  var buffer = new Buffer.from(data);
  fs.writeFileSync("filename.sqlite", buffer);
})