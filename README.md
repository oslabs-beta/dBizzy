<p align="center">
  <a href="https://github.com/oslabs-beta/dBizzy">
    <img src="https://github.com/oslabs-beta/dBizzy/raw/main/assets/dbizzy-logo-marketplace.png" alt="Logo" height="120">
  </a>

  <h3 align="center">dBizzy</h3>

  <p align="center">
    An intuitive VS Code Extension designed to facilitate early-stage database development.
    <br />
    <a href="https://github.com/oslabs-beta/dBizzy"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/oslabs-beta/dBizzy/issues">Report Bug</a>
    ·
    <a href="https://github.com/oslabs-beta/dBizzy/issues">Request Feature</a>
  </p>
    <!-- BADGES -->
  <p align="center">
    <!-- MARKETPLACE -->
    <a href="https://marketplace.visualstudio.com/items?itemName=dBizzy.dbizzy">
      <img src="https://vsmarketplacebadge.apphb.com/version-short/dBizzy.dbizzy.svg">
    </a>
    <!-- DOWNLOADS -->
    <a href="https://marketplace.visualstudio.com/items?itemName=dBizzy.dbizzy">
      <img src="https://vsmarketplacebadge.apphb.com/downloads-short/dBizzy.dbizzy.svg">
    </a>
    <!-- FORKS -->
    <a href="https://github.com/oslabs-beta/dBizzy/network/members"><img alt="GitHub forks" src="https://img.shields.io/github/forks/oslabs-beta/dBizzy"></a>
    <!-- STARS -->
    <a href="https://github.com/oslabs-beta/dBizzy/stargazers"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/oslabs-beta/dBizzy"></a>
    <!-- GITHUB RELEASE VERSION -->
    <a href="https://github.com/oslabs-beta/dBizzy/releases"><img alt="GitHub release (latest by date including pre-releases)" src="https://img.shields.io/github/v/release/oslabs-beta/dBizzy?include_prereleases"></a>
    <!-- LICENSE -->
    <a href="https://github.com/oslabs-beta/dBizzy/raw/main/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/oslabs-beta/dBizzy"></a>
    <!-- CONTRIBUTIONS -->
    <a href="https://github.com/oslabs-beta/dBizzy/blob/main/README.md"><img alt="Contributions" src="https://img.shields.io/badge/contributors-welcome-brightgreen"></a>
  </p>
</p>

## Features

Once the extension is installed, navigate to the command palette. Two commands are available: Preview Database and Open Database Browser.  

### Preview Database

Running the command [dBizzy: Preview Database] prompts .sql file selection.  The selected .sql file is then displayed in a new VSCode panel beside current panel.  Changes to the .sql file can be reflected in the visualization upon clicking 'Update Diagrams.'

![Preview Database](https://github.com/oslabs-beta/dBizzy/raw/main/media/preview-database.gif)


ER diagrams can be exported as SVG files by clicking the "Export Diagram" button. They will be saved in the current project directory folder. 

![Export ER Diagram](https://github.com/oslabs-beta/dBizzy/raw/main/media/export-diagram.gif)

### Open Database Browser

Running the command [dBizzy: Open Database Browser] prompts .sql file selection. The selected .sql file's text content is populated in the browser's query field.  Upon first executing a valid query, a database is created in memory and the query is executed.  Any returned results from the query are displayed under the query field.  The database is persistent and is cleared from memory upon closing the browser panel.

![Open Database Browser](https://github.com/oslabs-beta/dBizzy/raw/main/media/open-database.gif)

![Persistent Database](https://github.com/oslabs-beta/dBizzy/raw/main/media/persistent-database.gif)


## Features to improve / implement

* Database preview and database browser's compatilibility with various SQL services.  
* Testing suites
* Implementing TypeScript across all files

## Release Notes

### 0.0.5

Implements base product:
* Parses .sql files to display entity relationships.
* Creates database browsers to query databases in memory. Databases persist while browsers are open.

## Creators

* [Kai Rilliet](https://github.com/kairilliet)
* [Omar Rana](https://github.com/omar-rana)
* [Johnny Chen](https://github.com/JcsChen)
* [Matthew Lee](https://github.com/mcl030)

## Credits

* Link to [sql.js](https://www.npmjs.com/package/sql.js).
* Link to [diagrams.net](https://www.diagrams.net/).
* Link to [d3-graphviz](https://www.npmjs.com/package/d3-graphviz).
* Link to [Best README Template](https://github.com/othneildrew/Best-README-Template)