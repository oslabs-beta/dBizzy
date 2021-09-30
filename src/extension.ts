// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { countReset } from 'console';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { worker } from 'cluster';
import { format } from 'sql-formatter';
import { Base64 } from 'js-base64';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) { 

  // // And get the special URI to use with the webview
  // const scriptSrc = panel.webview.asWebviewUri(onDiskPath);


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "dbizzy" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.commands.registerCommand('dbizzy.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('bello World from dBizzy!');
	  })
  );
	
	// Preview Database -- create new webview panel 
	context.subscriptions.push(
		vscode.commands.registerCommand('dbizzy.previewDatabase', async () => {
      // Prompt user to select SQL file to preview
      let SQLfilePath = '';

      const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: 'Open',
        filters: {
           'SQL files': ['sql']
          }
      };
      
      await vscode.window.showOpenDialog(options).then(fileUri => {
        if (fileUri && fileUri[0]) {
          SQLfilePath = fileUri[0].fsPath;
        }
      });

      const preview = 'previewDatabase';
      const previewTitle = 'Preview Database';
      
      // Creates new webview panel beside current panel
      const panel = vscode.window.createWebviewPanel(
        preview, // type of webview, internal use
        previewTitle, // title of panel displayed to the user
        vscode.ViewColumn.Beside,
        {
          enableScripts: true
        }
      );
      
      // Get path to resource on disk
      const onDiskPath = vscode.Uri.file(
        path.join(context.extensionPath,'scripts', 'parser.js')
      );
      const styleDiskPath = vscode.Uri.file(
        path.join(context.extensionPath,'stylesheets', 'preview.css')
      );
      const logoDiskPath = vscode.Uri.file(
        path.join(context.extensionPath,'assets', 'dbizzy-logo.svg')
      );
    
      // And get the special URI to use with the webview
      const scriptSrc = panel.webview.asWebviewUri(onDiskPath);
      console.log(scriptSrc)
      const styleSrc = panel.webview.asWebviewUri(styleDiskPath);
      const logoSrc = panel.webview.asWebviewUri(logoDiskPath);

      panel.webview.html = getPreviewWebviewContent(preview, previewTitle, scriptSrc.toString(), styleSrc.toString(), logoSrc.toString());

      panel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'getText':
              let sqlText = fs.readFileSync(SQLfilePath, 'utf8');
              sqlText = format(sqlText);
              panel.webview.postMessage({ command: 'sendText' , text: sqlText});
              return;
            case 'parseButtonClicked': 
              panel.webview.postMessage({ command: 'parseAgain' });
              return;
            case 'exportSVG':
              // console.log('received exportSVG message', message.text)
              const dataUrl = message.text.split(',');
              const u8arr = Base64.toUint8Array(dataUrl[1]);
              const workspaceDirectory = path.join(__dirname, '../saved_diagrams/')
              
              const newFilePath = path.join(workspaceDirectory, 'VsCodeExtensionTest.svg');

              console.log('workspaceDirectory: ',workspaceDirectory)
              console.log('newFilePath', newFilePath)
              writeFile(newFilePath, message.text, () => {
                vscode.window.showInformationMessage(`The file ${newFilePath} has been created in the root of the workspace.`);      
              });
          }
        },
        undefined,
        context.subscriptions
      );
    
      function getWorkspaceFolder(): string {
        var folder = vscode.workspace.workspaceFolders;
        var directoryPath: string = '';
        if (folder != null) {
          directoryPath = folder[0].uri.fsPath;
        }
        return directoryPath;
      }
      
      function writeFile(filename: string, content: string | Uint8Array, callback: () => void) {
        fs.writeFile(filename, content, function (err) {
          if (err) {
            return console.error(err);
          }
          callback();
        });
      }
    })
  );


  // Query Database Command
	context.subscriptions.push(
		vscode.commands.registerCommand('dbizzy.openDatabaseBrowser', async () => {
      // Prompt user to select SQL file to preview
      let SQLfilePath = '';

      const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: 'Open',
        filters: {
           'SQL files': ['sql']
          }
      };
      
      await vscode.window.showOpenDialog(options).then(fileUri => {
        if (fileUri && fileUri[0]) {
          SQLfilePath = fileUri[0].fsPath;
        }
      });
      
      const query = 'openDatabaseBrowser';
      const queryTitle = 'Database Browser';
      const panel = vscode.window.createWebviewPanel(
        query, // type of webview, internal use
        queryTitle, // title of panel displayed to the user
        vscode.ViewColumn.Beside,
        {
          enableScripts: true
        }, 
      );

      // Get path to resource on disk
      const onDiskPath = vscode.Uri.file(
        path.join(context.extensionPath,'scripts', 'gui.js')
      );
      const workerFilePath = vscode.Uri.file(
        path.join(context.extensionPath,'scripts', 'worker.sql-wasm.js')
      );
      const styleDiskPath = vscode.Uri.file(
        path.join(context.extensionPath,'stylesheets', 'browser.css')
      );
      const logoDiskPath = vscode.Uri.file(
        path.join(context.extensionPath,'assets', 'dbizzy-logo.svg')
      );

      // And get the special URI to use with the webview
      const scriptSrc = panel.webview.asWebviewUri(onDiskPath);
      const workerSrc = panel.webview.asWebviewUri(workerFilePath);
      const styleSrc = panel.webview.asWebviewUri(styleDiskPath);
      const logoSrc = panel.webview.asWebviewUri(logoDiskPath);
      // const styleSrc = panel.webview.asWebviewUri(styleDiskPath);
      console.log('onDiskPath: ', onDiskPath);
      console.log('scriptSrc: ', scriptSrc);
      console.log('workerSrc: ', workerSrc);
      console.log('logoSrc: ', logoSrc);
      panel.webview.html = getBrowserWebviewContent(queryTitle, scriptSrc.toString(), workerSrc.toString(), styleSrc.toString(), logoSrc.toString());

      // Listens for 'getText' message.command from webview and sends back SQL file's text content
      panel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'getText':
              const sqlText = fs.readFileSync(SQLfilePath, 'utf8');
              console.log('sending text to webview: ', sqlText);
              panel.webview.postMessage({ command: 'sendText' , text: sqlText});
              // console.log('Browser path posted message: ', sqlText)
              return;
          }
        },
        undefined,
        context.subscriptions
      );
    })
  );
}


// starting index.html for previewing databases
const getPreviewWebviewContent = (view: string, viewTitle: string, scriptSrc: string, styleSrc: string, logoSrc: string) => {
  
  return (
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="${ styleSrc }">
      <script src="https://d3js.org/d3.v5.min.js"></script>
      <script src="https://unpkg.com/@hpcc-js/wasm@0.3.11/dist/index.min.js"></script>
      <script src="https://unpkg.com/d3-graphviz@3.0.5/build/d3-graphviz.js"></script>
      <script src="https://cdn.rawgit.com/eligrey/canvas-toBlob.js/f1a01896135ab378aa5c0118eadd81da55e698d8/canvas-toBlob.js"></script>
      <script src="https://cdn.rawgit.com/eligrey/FileSaver.js/e9d941381475b5df8b7d7691013401e171014e89/FileSaver.min.js"></script>
      <script type="text/javascript" src="${ scriptSrc }"></script>
      <title> ${ viewTitle } </title>
    </head>
    <body>
      <button id="exportButton">Export Diagram SVG</button>
      <h1 id="title"><img id="dbizzy_logo"src="${ logoSrc }">Entity-Relation Visualizer</h1>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const parseButton = document.querySelector('#sqlParseButton');
          const sqlInput = document.querySelector('#sqlInput');
          const exportButton = document.querySelector('#exportButton');

          const vscode = acquireVsCodeApi();
          function getText() {
            vscode.postMessage({
              command: 'getText'
            })
          };
          getText();
          parseButton.addEventListener('click', () => {
            getText();
            vscode.postMessage({
              command: 'parseButtonClicked'
            })
          })

          exportButton.addEventListener('click', () => {
            const svg = document.querySelectorAll('svg')[0];

            var svgData = document.querySelectorAll('svg')[0].outerHTML;
            console.log(svgData)

            let svgData2 = svgData.replace(/&nbsp;/g, ' ')
            console.log(svgData2)
            // var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
            // console.log('svgBlob',svgBlob)
            // var svgUrl = URL.createObjectURL(svgBlob);
            // svgUrl = svgUrl.slice(svgUrl.indexOf(':') + 1);
            // console.log('svgUrl',svgUrl)

            // const svgImage = document.createElement('img');
            // svgImage.src = svgUrl;
            // // document.querySelector('body').append(svgImage);
            // console.log('svgImage', svgImage)
            // const canvas = document.createElement('canvas');
            // canvas.width = svg.getAttribute('width');
            // canvas.height = svg.getAttribute('height');
            // const canvasCtx = canvas.getContext('2d');
            // canvasCtx.drawImage(svgImage, 0, 0);
            // const imgData = canvas.toDataURL('image/png');
  
            // console.log('imgData: ', imgData)



            vscode.postMessage({
              command: 'exportSVG', 
              text: svgData
            })


          })
        });

      </script> 
    </body>
    </html>`
  );
};

// starting index.html for previewing databases
const getBrowserWebviewContent = (queryTitle: String, guiScript: String, workerScript: String, styleSrc: string, logoSrc: string) => {

  return (
    `<!doctype html>
    <html>
    
    <head>
      <meta charset="utf8">
      <title>${ queryTitle }</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/codemirror.css">
      <link rel="stylesheet" href="${ styleSrc }">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/codemirror.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.1/worker.sql-wasm.min.js"
        integrity="sha512-yBPNUE8HTinpntnbSWtljJYMGIm1liPdtoj1XBbcMvZ/zyFOXHhKX83MW21bDrBSurr/KYMyyQv1QuKeI6ye1Q=="
        crossorigin="anonymous" referrerpolicy="no-referrer"></script>

    </head>
    
    <body>
      <h1 id="title"><img id="dbizzy_logo"src="${ logoSrc }">Local SQL Interpreter</h1>
    
      <main>
        <textarea id="commands">DROP TABLE IF EXISTS employees;
              CREATE TABLE employees( id          integer,  name    text,
              designation text,     manager integer,
              hired_on    date,     salary  integer,
              commission  float,    dept    integer);
              
              INSERT INTO employees VALUES (1,'JOHNSON','ADMIN',6,'1990-12-17',18000,NULL,4);
              INSERT INTO employees VALUES (2,'HARDING','MANAGER',9,'1998-02-02',52000,300,3);
              INSERT INTO employees VALUES (3,'TAFT','SALES I',2,'1996-01-02',25000,500,3);
              INSERT INTO employees VALUES (4,'HOOVER','SALES I',2,'1990-04-02',27000,NULL,3);
              INSERT INTO employees VALUES (5,'LINCOLN','TECH',6,'1994-06-23',22500,1400,4);
              INSERT INTO employees VALUES (6,'GARFIELD','MANAGER',9,'1993-05-01',54000,NULL,4);
              INSERT INTO employees VALUES (7,'POLK','TECH',6,'1997-09-22',25000,NULL,4);
              INSERT INTO employees VALUES (8,'GRANT','ENGINEER',10,'1997-03-30',32000,NULL,2);
              INSERT INTO employees VALUES (9,'JACKSON','CEO',NULL,'1990-01-01',75000,NULL,4);
              INSERT INTO employees VALUES (10,'FILLMORE','MANAGER',9,'1994-08-09',56000,NULL,2);
              INSERT INTO employees VALUES (11,'ADAMS','ENGINEER',10,'1996-03-15',34000,NULL,2);
              INSERT INTO employees VALUES (12,'WASHINGTON','ADMIN',6,'1998-04-16',18000,NULL,4);
              INSERT INTO employees VALUES (13,'MONROE','ENGINEER',10,'2000-12-03',30000,NULL,2);
              INSERT INTO employees VALUES (14,'ROOSEVELT','CPA',9,'1995-10-12',35000,NULL,1);
              
              SELECT designation,COUNT(*) AS nbr, (AVG(salary)) AS avg_salary FROM employees GROUP BY designation ORDER BY avg_salary DESC;
              SELECT name,hired_on FROM employees ORDER BY hired_on;</textarea>
        <div class="button_container">
          <button id="execute" class="button">Execute</button>
          <button id='savedb' class="button">Save the db</button>
          <label id='savedesc' class="button">Load an SQLite database file: <input type='file' id='dbfile'></label>
          <button id="localdb" class="button">Use Local File</button>
        </div>
        <div id="query_performance"></div>
        <div id="error" class="error"></div>
    
        <pre id="output">Results will be displayed here</pre>
      </main>
    
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/mode/sql/sql.min.js"></script>
    
      <!--
      <footer>
        Original work by kripken (<a href='https://github.com/sql-js/sql.js'>sql.js</a>).
        C to Javascript compiler by kripken (<a href='https://github.com/kripken/emscripten'>emscripten</a>).
      </footer>
      -->
      <script type="text/javascript">
        const workerSource = '${workerScript}';
        
        const sqlInput = document.querySelector('#commands');
        (function() {
          const vscode = acquireVsCodeApi();
          vscode.postMessage({
              command: 'getText'
          })    
        }());

      </script>

      <script type="text/javascript" src="${ guiScript }"></script>

      <script type="text/javascript">

        window.addEventListener('message', event => {
          const message = event.data;
          switch (message.command) {
            case 'sendText':
              console.log('Webview received message text: ',message.text);
              sqlInput.value = message.text;
              break;
          }
        });
      </script>

    </body>
    
    </html>`
  );
};

// this method is called when your extension is deactivated
export function deactivate() {}
