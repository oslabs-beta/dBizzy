"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const sql_formatter_1 = require("sql-formatter");
// your extension is activated the very first time the command is executed
function activate(context) {
    // Preview Database -- create new webview panel 
    context.subscriptions.push(vscode.commands.registerCommand('dbizzy.previewDatabase', () => __awaiter(this, void 0, void 0, function* () {
        // Prompt user to select SQL file to preview
        let SQLfilePath = '';
        const options = {
            canSelectMany: false,
            openLabel: 'Open',
            filters: {
                'SQL files': ['sql']
            }
        };
        yield vscode.window.showOpenDialog(options).then(fileUri => {
            if (fileUri && fileUri[0]) {
                SQLfilePath = fileUri[0].fsPath;
            }
        });
        const preview = 'previewDatabase';
        const previewTitle = 'Preview Database';
        // Creates new webview panel beside current panel
        const panel = vscode.window.createWebviewPanel(preview, // type of webview, internal use
        previewTitle, // title of panel displayed to the user
        vscode.ViewColumn.Beside, {
            enableScripts: true
        });
        // Get path to resource on disk
        const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'scripts', 'parser.js'));
        const styleDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'stylesheets', 'preview.css'));
        const logoDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'assets', 'dbizzy-logo.svg'));
        // And get the special URI to use with the webview
        const scriptSrc = panel.webview.asWebviewUri(onDiskPath);
        const styleSrc = panel.webview.asWebviewUri(styleDiskPath);
        const logoSrc = panel.webview.asWebviewUri(logoDiskPath);
        panel.webview.html = getPreviewWebviewContent(preview, previewTitle, scriptSrc.toString(), styleSrc.toString(), logoSrc.toString());
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'getText':
                    let sqlText = fs.readFileSync(SQLfilePath, 'utf8');
                    sqlText = (0, sql_formatter_1.format)(sqlText);
                    panel.webview.postMessage({ command: 'sendText', text: sqlText });
                    return;
                case 'parseButtonClicked':
                    panel.webview.postMessage({ command: 'parseAgain' });
                    return;
                case 'exportSVG':
                    const workspaceDirectory = getWorkspaceFolder();
                    const newFilePath = path.join(workspaceDirectory, 'dBizzyPreview.svg');
                    writeFile(newFilePath, message.text, () => {
                        vscode.window.showInformationMessage(`The file dBizzyPreview.svg has been updated!`);
                    });
            }
        }, undefined, context.subscriptions);
        function getWorkspaceFolder() {
            var folder = vscode.workspace.workspaceFolders;
            var directoryPath = '';
            if (folder != null) {
                directoryPath = folder[0].uri.fsPath;
            }
            return directoryPath;
        }
        function writeFile(filename, content, callback) {
            fs.writeFile(filename, content, function (err) {
                if (err) {
                    return console.error(err);
                }
                callback();
            });
        }
    })));
    // Query Database Command
    context.subscriptions.push(vscode.commands.registerCommand('dbizzy.openDatabaseBrowser', () => __awaiter(this, void 0, void 0, function* () {
        // Prompt user to select SQL file to preview
        let SQLfilePath = '';
        const options = {
            canSelectMany: false,
            openLabel: 'Open',
            filters: {
                'SQL files': ['sql']
            }
        };
        yield vscode.window.showOpenDialog(options).then(fileUri => {
            if (fileUri && fileUri[0]) {
                SQLfilePath = fileUri[0].fsPath;
            }
        });
        const query = 'openDatabaseBrowser';
        const queryTitle = 'Database Browser';
        const panel = vscode.window.createWebviewPanel(query, // type of webview, internal use
        queryTitle, // title of panel displayed to the user
        vscode.ViewColumn.Beside, {
            enableScripts: true
        });
        // Get path to resource on disk
        const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'scripts', 'browser.js'));
        const workerFilePath = vscode.Uri.file(path.join(context.extensionPath, 'scripts', 'worker.sql-wasm.js'));
        const styleDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'stylesheets', 'browser.css'));
        const logoDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'assets', 'dbizzy-logo.svg'));
        // And get the special URI to use with the webview
        const scriptSrc = panel.webview.asWebviewUri(onDiskPath);
        const workerSrc = panel.webview.asWebviewUri(workerFilePath);
        const styleSrc = panel.webview.asWebviewUri(styleDiskPath);
        const logoSrc = panel.webview.asWebviewUri(logoDiskPath);
        panel.webview.html = getBrowserWebviewContent(queryTitle, scriptSrc.toString(), workerSrc.toString(), styleSrc.toString(), logoSrc.toString());
        // Listens for 'getText' message.command from webview and sends back SQL file's text content
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'getText':
                    const sqlText = fs.readFileSync(SQLfilePath, 'utf8');
                    panel.webview.postMessage({ command: 'sendText', text: sqlText });
                    return;
            }
        }, undefined, context.subscriptions);
    })));
}
exports.activate = activate;
// starting index.html for previewing databases
const getPreviewWebviewContent = (view, viewTitle, scriptSrc, styleSrc, logoSrc) => {
    return (`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="${styleSrc}">
      <script src="https://d3js.org/d3.v5.min.js"></script>
      <script src="https://unpkg.com/@hpcc-js/wasm@0.3.11/dist/index.min.js"></script>
      <script src="https://unpkg.com/d3-graphviz@3.0.5/build/d3-graphviz.js"></script>
      <script src="https://cdn.rawgit.com/eligrey/canvas-toBlob.js/f1a01896135ab378aa5c0118eadd81da55e698d8/canvas-toBlob.js"></script>
      <script src="https://cdn.rawgit.com/eligrey/FileSaver.js/e9d941381475b5df8b7d7691013401e171014e89/FileSaver.min.js"></script>
      <script type="text/javascript" src="${scriptSrc}"></script>
      <title> ${viewTitle} </title>
    </head>
    <body>
      <button id="exportButton">Export Diagram SVG</button>
      <h1 id="title"><img id="dbizzy_logo"src="${logoSrc}">Entity-Relation Visualizer</h1>
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
            const svgData = document.querySelectorAll('svg')[0].outerHTML.replace(/&nbsp;/g, '&#160;');
            vscode.postMessage({
              command: 'exportSVG', 
              text: svgData
            })
          })
        });

      </script> 
    </body>
    </html>`);
};
// starting index.html for previewing databases
const getBrowserWebviewContent = (queryTitle, guiScript, workerScript, styleSrc, logoSrc) => {
    return (`<!doctype html>
    <html>
    
    <head>
      <meta charset="utf8">
      <title>${queryTitle}</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/codemirror.css">
      <link rel="stylesheet" href="${styleSrc}">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/codemirror.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.1/worker.sql-wasm.min.js"
        integrity="sha512-yBPNUE8HTinpntnbSWtljJYMGIm1liPdtoj1XBbcMvZ/zyFOXHhKX83MW21bDrBSurr/KYMyyQv1QuKeI6ye1Q=="
        crossorigin="anonymous" referrerpolicy="no-referrer"></script>

    </head>
    
    <body>
      <h1 id="title"><img id="dbizzy_logo"src="${logoSrc}">Local SQL Interpreter</h1>
    
      <main>
        <textarea id="commands">-- Did not select .sql file!</textarea>
        <div class="button_container">
          <button id="execute" class="button">Execute</button>
        </div>
        <div id="query_performance"></div>
        <div id="error" class="error"></div>
    
        <pre id="output">Results will be displayed here</pre>
      </main>
    
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/mode/sql/sql.min.js"></script>
    
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
      <script type="text/javascript" src="${guiScript}"></script>
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
    
    </html>`);
};
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map