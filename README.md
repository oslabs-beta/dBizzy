## \[dBizzy\]\(assets/dbizzy-logo.svg\) About

dBizzy is an easy-to-use VS Code Extension designed to facilitate early-stage database development.

## Features

Once the extension is installed, navigate to the command palette. Two commands are available: Preview Database and Open Database Browser.  

### Preview Database

Running the command [dBizzy: Preview Database] prompts .sql file selection.  Selected .sql file is then displayed in new VSCode panel beside current panel.  Changes to the .sql file can be reflected in the visualization upon clicking 'Update Diagrams.'

\!\[Preview Database\]\(images/feature-x.png\)

### Open Database Browser

Running the command [dBizzy: Open Database Browser] prompts .sql file selection. Selected .sql file's text content is populated in the browser's query field.  Upon first executing a valid query, a database is created in memory and the query is executed.  Any returned results from the query are displayed under the query field.  The database is cleared from memory upon closing the browser panel.  

\!\[Open Database Browser\]\(images/feature-x.png\)

## Features to improve / implement

* Database preview's compatilibility with various SQL services.  

## Release Notes

### 0.0.1

Implements base product:
* Parses .sql files to display entity relationships.
* Creates database browsers to query databases in memory.  Databases persist while browsers are open.

## Credits

* Link sql.js
* Link diagrams.net
* Link d3-graphviz