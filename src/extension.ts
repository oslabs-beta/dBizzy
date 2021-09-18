// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { countReset } from 'console';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) { 
	const styleDiskPath = vscode.Uri.file(
    path.join(context.extensionPath,'src', 'styles.css')
  );

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
      
      let filePath = '';

      const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: 'Open',
        filters: {
           'SQL files': ['sql'],
           'All files': ['*']
          }
      };
      
      await vscode.window.showOpenDialog(options).then(fileUri => {
        if (fileUri && fileUri[0]) {
          filePath = fileUri[0].fsPath;
        }
      });

      vscode.window.showInformationMessage('hello>');
      const preview = 'previewDatabase';
      const previewTitle = 'Preview Database';
      
      // prompt user to select sql file

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
        path.join(context.extensionPath,'src', 'sql.js')
      );

      // And get the special URI to use with the webview
      const scriptSrc = panel.webview.asWebviewUri(onDiskPath);
      const styleSrc = panel.webview.asWebviewUri(styleDiskPath);

      panel.webview.html = getWebviewContent(preview, previewTitle, scriptSrc.toString(), styleSrc.toString());

      panel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'getText':
              const sqlText = fs.readFileSync(filePath, 'utf8')
              panel.webview.postMessage({ command: 'sendText' , text: sqlText});
              return;
          }
        },
        undefined,
        context.subscriptions
      );
    

    })
  );
	context.subscriptions.push(
		vscode.commands.registerCommand('dbizzy.queryDatabase', () => {
      const query = 'queryDatabase';
      const queryTitle = 'Query Database';
      const panel = vscode.window.createWebviewPanel(
        query, // type of webview, internal use
        queryTitle, // title of panel displayed to the user
        vscode.ViewColumn.Beside,
        {}
      );

      panel.webview.html = getWebviewContent(query, queryTitle, '', '');
    })
  );
}


// starting index.html  
const getWebviewContent = (view: string, viewTitle: string, scriptSrc: string, styleSrc: string) => {
  
  return (
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="${ styleSrc }">
      <script type="text/javascript" src="${ scriptSrc }"></script>
      <title> ${ viewTitle } </title>
    </head>
    <body>
      <!-- 
      <div id=${ view }>
        hello team dBizzy:
        ${ view }
      </div> 
      -->
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const sqlInput = document.querySelector('#sqlInput');
          (function() {
            const vscode = acquireVsCodeApi();
            function setIntervalImmediately(func, interval) {
              func();
              return setInterval(func, interval);
            };
            setIntervalImmediately(() => {
              vscode.postMessage({
                command: 'getText'
              })    
            }, 1000)
          }())
        });
      </script> 
    </body>
    </html>`
  );
};

// this method is called when your extension is deactivated
export function deactivate() {}
