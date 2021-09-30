const execBtn = document.getElementById("execute");
const outputElm = document.getElementById('output');
const errorElm = document.getElementById('error');
const commandsElm = document.getElementById('commands');
const dbFileElm = document.getElementById('dbfile');
const savedbElm = document.getElementById('savedb');
const localBtn = document.getElementById('localdb');
const queryPerformance = document.getElementById('query_performance');

let worker;

// Performs fetch request to get worker.sql-wasm.js file
fetch(workerSource, {
  method: 'GET', 
})
  // Turn fetch results into blob
  .then(result => result.blob())
  .then(blob => {
    // Create url using fetch blob and use that to create new web worker
    const blobUrl = URL.createObjectURL(blob);
    console.log('BLOBLUR', blobUrl)
    worker = new Worker(blobUrl);

    worker.onerror = error;

    // Open a database
    worker.postMessage({ action: 'open' });

    // Connect to the HTML element we 'print' to
    function print(text) {
      outputElm.innerHTML = text.replace(/\n/g, '<br>');
    }
    function error(e) {
      console.log(e);
      errorElm.style.height = '2em';
      errorElm.textContent = e.message;
    }

    function noerror() {
      errorElm.style.height = '0';
    }

    // Run a command in the database
    function execute(commands) {
      tic();
      worker.onmessage = function (event) {
        const results = event.data.results;
        toc("Executing SQL");
        if (!results) {
          error({ message: event.data.error });
          return;
        }

        tic();
        outputElm.innerHTML = "";
        for (let i = 0; i < results.length; i++) {
          outputElm.appendChild(tableCreate(results[i].columns, results[i].values));
        }
        toc("Query Execution Time");
      }
      worker.postMessage({ action: 'exec', sql: commands });
      outputElm.textContent = "Fetching results...";
    }

    // Create an HTML table
    const tableCreate = function () {
      function valconcat(vals, tagName) {
        if (vals.length === 0) return '';
        const open = '<' + tagName + '>', close = '</' + tagName + '>';
        return open + vals.join(close + open) + close;
      }
      return function (columns, values) {
        const tbl = document.createElement('table');
        let html = '<thead>' + valconcat(columns, 'th') + '</thead>';
        const rows = values.map(function (v) { return valconcat(v, 'td'); });
        html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
        tbl.innerHTML = html;
        return tbl;
      }
    }();

    // Execute the commands when the button is clicked
    function execEditorContents() {
      noerror()
      execute(editor.getValue() + ';');
    }
    execBtn.addEventListener("click", execEditorContents, true);

    // Performance measurement functions
    let tictime;
    if (!window.performance || !performance.now) { window.performance = { now: Date.now } }
    function tic() { tictime = performance.now() }
    function toc(msg) {
      const dt = performance.now() - tictime;
      queryPerformance.innerText = `${msg || 'toc'}` + ': ' + dt + 'ms';
      console.log((msg || 'toc') + ": " + dt + "ms");
    }

    // Add syntax highlighting to the textarea
    const editor = CodeMirror.fromTextArea(commandsElm, {
      mode: 'text/x-mysql',
      viewportMargin: Infinity,
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      matchBrackets: true,
      autofocus: true,
      extraKeys: {
        "Ctrl-Enter": execEditorContents,
        "Ctrl-S": savedb,
      }
    });

    // Loading database from a SQL file
    dbFileElm.onchange = function () {
      const f = dbFileElm.files[0];
      const r = new FileReader();
      r.onload = function () {
        worker.onmessage = function () {
          toc("Loading database from file");
          // Show the schema of the loaded database
          editor.setValue("SELECT `name`, `sql`\n  FROM `sqlite_master`\n  WHERE type='table';");
          execEditorContents();
        };
        tic();
        try {
          worker.postMessage({ action: 'open', buffer: r.result }, [r.result]);
        }
        catch (exception) {
          worker.postMessage({ action: 'open', buffer: r.result });
        }
      }
      r.readAsArrayBuffer(f);
    }

    // not being used
    // Save the db to a file
    function savedb() {
      worker.onmessage = function (event) {
        toc("Exporting the database");
        var arraybuff = event.data.buffer;
        var blob = new Blob([arraybuff]);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.href = window.URL.createObjectURL(blob);
        a.download = "sql.db";
        a.onclick = function () {
          setTimeout(function () {
            window.URL.revokeObjectURL(a.href);
          }, 1500);
        };
        a.click();
      };
      tic();
      worker.postMessage({ action: 'export' });
    }
    savedbElm.addEventListener("click", savedb, true);
  });
