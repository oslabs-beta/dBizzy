// const { parse } = require("path/posix");

document.addEventListener('DOMContentLoaded', () => {
  // Declare constants to refer to HTML elements
  const body = document.querySelector('body');
  const graph = document.querySelector('#graph');

  // Create button for updating ER diagrams, prepend to body
  const parseButton = document.createElement('button');
  parseButton.setAttribute('id', 'sqlParseButton');
  parseButton.innerText = 'Update Diagrams';
  body.prepend(parseButton);

  // Create textarea for SQL Query Set to read-only since we expect users to be reading from a file
  // Prepend textarea to body
  const sqlInput = document.createElement('textarea');
  sqlInput.setAttribute('id', 'sqlInput');
  sqlInput.setAttribute('readonly', 'true');
  sqlInput.style.display = 'none';
  sqlInput.style.height = '200px';
  sqlInput.style.width = '100%';
  sqlInput.value = 'CREATE TABLE Persons\n(\nPersonID int PRIMARY KEY,\nLastName varchar(255),\n' +
    'FirstName varchar(255),\nAddress varchar(255),\nCity varchar(255)\n);';
  body.prepend(sqlInput);

  // Declare various model classes
  function TableModel() {
    this.Name = null;
    this.Properties = []
  }

  function PropertyModel() {
    this.Name = null;
    this.Value = null;
    this.TableName = null;
    this.References = [];
    this.IsPrimaryKey = false;
    this.IsForeignKey = false;
  }

  function ForeignKeyModel() {
    this.PrimaryKeyName = null;
    this.ReferencesPropertyName = null

    this.PrimaryKeyTableName = null;
    this.ReferencesTableName = null;

    this.IsDestination = false;
  }

  function PrimaryKeyModel() {
    this.PrimaryKeyName = null;
    this.PrimaryKeyTableName = null;
  }

  // Creating global empty arrays to hold foreign keys, primary keys, and tableList
  let foreignKeyList = [];
  let primaryKeyList = [];
  let tableList = [];

  // Parses foreign key with SQL Server syntax
  function ParseSQLServerForeignKey(name, currentTableModel, propertyType) {
    // Regex expression to find referenced foreign table 
    const referencesIndex = name.match(/(?<=REFERENCES\s)([a-zA-Z_]+)(\([a-zA-Z_]*\))/);
    const referencedTableName = referencesIndex[1];
    const referencedPropertyName = referencesIndex[2].replace(/\(|\)/g, '');

    // Remove everything after 'foreign key' from line
    const foreignKeyLabelIndex = name.toLowerCase().indexOf('foreign key');
    let foreignKey = name.slice(0, foreignKeyLabelIndex).trim();
    
    // If 'primary key' exists in line, remove 'primary key'
    const primaryKeyLabelIndex = name.toLowerCase().indexOf('primary key');
    if (primaryKeyLabelIndex >= 0) {
      foreignKey = foreignKey.slice(0, primaryKeyLabelIndex).trim();
    };

    if (referencesIndex !== -1) {

      //Create ForeignKey with IsDestination = false
      const foreignKeyOriginModel = CreateForeignKey(foreignKey, currentTableModel.Name, referencedPropertyName, referencedTableName, false);

      //Add ForeignKey Origin
      foreignKeyList.push(foreignKeyOriginModel);

      //Create ForeignKey with IsDestination = true
      const foreignKeyDestinationModel = CreateForeignKey(referencedPropertyName, referencedTableName, foreignKey, currentTableModel.Name, true);

      //Add ForeignKey Destination
      foreignKeyList.push(foreignKeyDestinationModel);

      //Create Property
      const propertyModel = CreateProperty(foreignKey, currentTableModel.Name, null, false);

      // If property is both primary key and foreign key, set IsPrimaryKey property to true
      if (propertyType === 'SQLServer both') {
        propertyModel.IsPrimaryKey = true;
      }

      //Add Property to table
      currentTableModel.Properties.push(propertyModel);
    }
  };
  
  function ParseMySQLForeignKey(name, currentTableModel) {
    // Parsing Foreign Key from MySQL syntax
    name = name.replace(/\"/g, '');

    let foreignKeyName = name.match(/(?<=FOREIGN\sKEY\s)(\([a-zA-Z_]+\))(?=\sREFERENCES\s)/)[0].replace(/\(|\)/g, '');
    const referencedTableName = name.match(/(?<=REFERENCES\s)([a-zA-Z_]+)(?=\()/)[0];
    const referencedPropertyName = name.match(/(?<=REFERENCES\s[a-zA-Z_]+)(\([a-zA-Z_]+\))/)[0].replace(/\(|\)/g, '');

    // Look through current table and reassign isForeignKey prop to true, reassign foreignKeyName to include type
    currentTableModel.Properties.forEach(property => {
      if (property.Name.split(' ')[0] === foreignKeyName) {
        property.IsForeignKey = true;
        foreignKeyName = property.Name;
      }
    })

    // Create ForeignKey
    const foreignKeyOriginModel = CreateForeignKey(foreignKeyName, currentTableModel.Name, referencedPropertyName, referencedTableName, false);

    // Add ForeignKey Origin
    foreignKeyList.push(foreignKeyOriginModel);

    // Create ForeignKey
    const foreignKeyDestinationModel = CreateForeignKey(referencedPropertyName, referencedTableName, foreignKeyName, currentTableModel.Name, true);

    // Add ForeignKey Destination
    foreignKeyList.push(foreignKeyDestinationModel);
  }

  // Iterates through primaryKeyList and checks every property in every table
  // If primaryKeyList.Name === propertyModel.Name, set IsPrimaryKey property to true
  function ProcessPrimaryKey() {
    primaryKeyList.forEach(function (primaryModel) {
      tableList.forEach(function (tableModel) {
        if (tableModel.Name === primaryModel.PrimaryKeyTableName) {
          tableModel.Properties.forEach(function (propertyModel) {
            if (propertyModel.Name === primaryModel.PrimaryKeyName) {
              propertyModel.IsPrimaryKey = true;
            }
          });
        }
      });
    });
  }

  // Iterates through foreignKeyList and checks every property in every table
  // If propertyModel's name equals what the foreignKeyModel is referencing, set propertyModel.IsForeignKey to true and add foreignKeyModel to propertyModel.References array
  function ProcessForeignKey() {
    foreignKeyList.forEach(function (foreignKeyModel) {
      tableList.forEach(function (tableModel) {
        if (tableModel.Name === foreignKeyModel.ReferencesTableName) {
          tableModel.Properties.forEach(function (propertyModel) {
            if (propertyModel.Name === foreignKeyModel.ReferencesPropertyName) {
              propertyModel.IsForeignKey = true;
              propertyModel.References.push(foreignKeyModel);
            }
          });
        }
      });
    });
  }

  // Creates foreignKeyModel and assigns properties to arguments passed in
  function CreateForeignKey(primaryKeyName, primaryKeyTableName, referencesPropertyName, referencesTableName, isDestination) {
    const foreignKey = new ForeignKeyModel;
    
    foreignKey.PrimaryKeyTableName = primaryKeyTableName;
    foreignKey.PrimaryKeyName = primaryKeyName;
    foreignKey.ReferencesPropertyName = referencesPropertyName;
    foreignKey.ReferencesTableName = referencesTableName;
    foreignKey.IsDestination = (isDestination !== undefined && isDestination !== null) ? isDestination : false;

    return foreignKey;
  };
  
  // Creates primaryKeyModel and assigns properties to arguments passed in 
  function CreatePrimaryKey(primaryKeyName, primaryKeyTableName) {
    const primaryKey = new PrimaryKeyModel;

    primaryKey.PrimaryKeyTableName = primaryKeyTableName;
    primaryKey.PrimaryKeyName = primaryKeyName;

    return primaryKey;
  };

  // Creates propertyModel and assigns properties to arguments passed in
  function CreateProperty(name, tableName, foreignKey, isPrimaryKey) {
    const property = new PropertyModel;
    const isForeignKey = foreignKey !== undefined && foreignKey !== null;
    property.Name = name;
    property.TableName = tableName;
    property.IsForeignKey = isForeignKey;
    property.IsPrimaryKey = isPrimaryKey;
    return property;
  };

  // Creates a new table with name property assigned to argument passed in
  function CreateTable(name) {
    var table = new TableModel;

    table.Name = name;

    // Increment exported tables count
    exportedTables++;

    return table;
  };

  // Parses table name from CREATE TABLE line
  function ParseSQLServerName(name, property) {
    name = name.replace('[dbo].[', '');
    name = name.replace('](', '');
    name = name.replace('].[', '.');
    name = name.replace('[', '');

    if (property == undefined || property == null) {
      name = name.replace(' [', '');
      name = name.replace('] ', '');
    } else {
      if (name.indexOf(']') !== -1) {
        name = name.substring(0, name.indexOf(']'));
      }
    }

    if (name.lastIndexOf(']') === (name.length - 1)) {
      name = name.substring(0, name.length - 1);
    }

    if (name.lastIndexOf(')') === (name.length - 1)) {
      name = name.substring(0, name.length - 1);
    }

    if (name.lastIndexOf('(') === (name.length - 1)) {
      name = name.substring(0, name.length - 1);
    }

    name = name.replace(' ', '');

    return name;
  };

  // Checks whether CREATE TABLE query has '(' on separate line
  function ParseTableName(name) {
    if (name.charAt(name.length - 1) === '(') {
      name = ParseSQLServerName(name);
    }

    return name;
  };

  function parseAlterTable(tableName, constraint) {
    // const tableName = tmp.match(/(?<=ALTER\sTABLE\s)([a-zA-Z_]+)(?=\sADD\sCONSTRAINT)/)[0];
    tableName = tableName.trim();
    let currentTableModel;
    tableList.forEach(tableModel => {
      if (tableModel.Name === tableName) {
        currentTableModel = tableModel;
      }
    })
    if (constraint.indexOf('FOREIGN KEY') !== -1) {
      const name = constraint.substring(constraint.indexOf('FOREIGN KEY'), constraint.length - 1);
      ParseMySQLForeignKey(name, currentTableModel);
    } else if (constraint.indexOf('PRIMARY KEY') !== -1) {
      const name = constraint.substring(constraint.indexOf('PRIMARY KEY'), constraint.length - 1);
      parseMYSQLPrimaryKey(name, currentTableModel);
    }
  }

  function parseSQLServerPrimaryKey(name, currentTableModel, propertyType) {
    var primaryKey = name.replace('PRIMARY KEY (', '')
      .replace(')', '')
      .replace('PRIMARY KEY', '')
      .replace(/\"/g, '')
      .trim();

    // Create Primary Key
    var primaryKeyModel = CreatePrimaryKey(primaryKey, currentTableModel.Name);

    // Add Primary Key to List
    primaryKeyList.push(primaryKeyModel);

    // Create Property
    var propertyModel = CreateProperty(primaryKey, currentTableModel.Name, null, true);

    // Add Property to table if not both primary key and foreign key
      // If both, property is added when parsing foreign key
    if (propertyType !== 'SQLServer both') {
      currentTableModel.Properties.push(propertyModel);
    }
  }

  function parseMYSQLPrimaryKey(name, currentTableModel) {
    var primaryKeyName = name.slice(13).replace(')', '').replace(/\"/g, '');
    currentTableModel.Properties.forEach(property => {
      if (property.Name.split(' ')[0] === primaryKeyName) {
        property.IsPrimaryKey = true;
        primaryKeyList.push(property);
      }
    })
  }

  // Takes in SQL creation file as text, then parses
  function parseSql(text) {
    const lines = text.split('\n');
    console.log(lines);
    tableCell = null;
    cells = [];
    exportedTables = 0;
    tableList = [];
    foreignKeyList = [];

    let currentTableModel = null;

    //Parse SQL to objects
    for (let i = 0; i < lines.length; i++) {

      rowCell = null;

      const tmp = lines[i].trim();

      const propertyRow = tmp.substring(0, 12).toLowerCase();

      if (currentTableModel !== null && tmp.includes(');')) {
        tableList.push(currentTableModel);
        currentTableModel = null;
      }

      //Parse Table
      if (propertyRow === 'create table') {

        //Parse row
        let name = tmp.substring(12).trim();

        //Parse Table Name
        name = ParseTableName(name);


        //Create Table
        currentTableModel = CreateTable(name);
      }
      // tmp === 'ALTER TABLE'
      else if (tmp === 'ALTER TABLE') {
        parseAlterTable(lines[i + 1], lines[i + 3]);
        i += 3;
      }

      // Parse Properties 
      else if (tmp !== '(' && currentTableModel != null && propertyRow !== 'alter table ') {

        //Parse the row
        var name = tmp.substring(0, (tmp.charAt(tmp.length - 1) === ',') ? tmp.length - 1 : tmp.length);

        // Check if first 10 characters are 'constraint'
        var constraint = name.substring(0, 10).toLowerCase();
        if (constraint === 'constraint') {
          // console.log('name before: ', name)
          if (name.indexOf("PRIMARY KEY") !== -1) {
            name = name.substring(name.indexOf("PRIMARY KEY"), name.length).replace(/\"/g, "")
          } else if (name.indexOf("FOREIGN KEY") !== -1) {
            name = name.substring(name.indexOf("FOREIGN KEY"), name.length).replace(/\"/g, "")
          }
          // console.log('name after: ', name)
        }

        //Attempt to get the Key Type
        var propertyType = name.substring(0, 11).toLowerCase();
        //Add special constraints
        if (propertyType !== 'primary key' && propertyType !== 'foreign key') {
          if (tmp.indexOf("PRIMARY KEY") !== -1 && tmp.indexOf("FOREIGN KEY") !== -1) {
            propertyType = "SQLServer both";
          } else if (tmp.indexOf("PRIMARY KEY") !== -1) {
            propertyType = "SQLServer primary key";
          } else if (tmp.indexOf("FOREIGN KEY") !== -1) {
            propertyType = "SQLServer foreign key";
          }
        }
        // Verify if this is a property that doesn't have a relationship (One minute of silence for the property)
        var normalProperty = propertyType !== 'primary key' && propertyType !== 'foreign key' && propertyType !== 'SQLServer primary key' && propertyType !== 'SQLServer foreign key' && propertyType !== 'SQLServer both';

        // Parse properties that don't have relationships
        if (normalProperty) {

          if (name === '' || name === "" || name === ");") {
            continue;
          }

          // For now, skip lines with these commands
          if (name.indexOf("ASC") !== -1 ||
            name.indexOf("DESC") !== -1 ||
            name.indexOf("EXEC") !== -1 ||
            name.indexOf("WITH") !== -1 ||
            name.indexOf("ON") !== -1 ||
            name.indexOf("ALTER") !== -1 ||
            name.indexOf("/*") !== -1 ||
            name.indexOf("CONSTRAIN") !== -1 ||
            name.indexOf("SET") !== -1 ||
            name.indexOf("NONCLUSTERED") !== -1 ||
            name.indexOf("GO") !== -1 ||
            name.indexOf("REFERENCES") !== -1 ||
            name.indexOf("OIDS") !== -1) {
            continue;
          }


          // Takes quotation marks out of normal property names
          name = name.replace(/\"/g, '');

          // Create Property
          var propertyModel = CreateProperty(name, currentTableModel.Name, null, false, false);

          // Add Property to table
          currentTableModel.Properties.push(propertyModel);
        }

        // Parse Primary Key
        if (propertyType === 'primary key' || propertyType === 'SQLServer primary key' || propertyType === 'SQLServer both') {
          // Parse Primary Key from SQL Server syntax
          if (propertyType === 'SQLServer primary key' || propertyType === 'SQLServer both') {
            if (name.indexOf('PRIMARY KEY') !== -1 && name.indexOf('CLUSTERED') === -1) {
              parseSQLServerPrimaryKey(name, currentTableModel, propertyType);
            } 
            
            // Parsing primary key from MySQL syntax
          } else if (propertyType === 'primary key') {
            parseMYSQLPrimaryKey(name, currentTableModel);
          }
        }

        // Parse Foreign Key
        if (propertyType === 'foreign key' || propertyType === 'SQLServer foreign key' || propertyType === 'SQLServer both') {
          // Parse Foreign Key from SQL Server syntax
          if (propertyType === 'SQLServer foreign key' || propertyType === 'SQLServer both') {
            let completeRow = name;
            if (propertyType === 'SQLServer both') {
              console.log(completeRow)
            }
            if (name.indexOf('REFERENCES') === -1) {
              const referencesRow = (lines[i + 1]).trim();
              completeRow = 'ALTER TABLE [dbo].[' + currentTableModel.Name + ']  WITH CHECK ADD' + ' ' + name + ' ' + referencesRow;
            }
            ParseSQLServerForeignKey(completeRow, currentTableModel, propertyType);
          }
          else {
            ParseMySQLForeignKey(name, currentTableModel);
          }
        }
      } 
    }

    // Process Primary Keys
    ProcessPrimaryKey();
    console.log(primaryKeyList);
    // Process Foreign Keys
    ProcessForeignKey();

    // Create Table in UI
    console.log(tableList)
    CreateTableUI();

  };
  // Adding Primary Key and Foreign Key designations for table columns
  function CheckSpecialKey(propertyModel) {
    if (propertyModel.IsForeignKey && propertyModel.IsPrimaryKey) {
      console.log('FOUND OUR BOTH:', propertyModel)
      return 'PK | FK';
    } else if (propertyModel.IsForeignKey) {
      return 'FK';
    } else if (propertyModel.IsPrimaryKey) {
      return 'PK';
    } else {
      return '';
    }
  }

  /*
  CreateTableUI() 
  Function that handles generation of graphviz wrapped in d3
  Uses an array d3Tables to keep track of all string syntax needed for graphviz
  strings are pushed into the array as needed and combined at the end 
   */
  function CreateTableUI() {
    // Declaring custom d3 colors
    // #b0e298
    // Initial opening string for the rendering of the diagram.
    // Refer to https://graphviz.readthedocs.io/en/stable/manual.html#quoting-and-html-like-labels 
    let d3Tables = [`digraph G { bgcolor = "none"
      graph [   rankdir = "LR" ];
      node [fontsize = 10 fontname = "opensans" shape=plain]`];

    tableList.forEach(function (tableModel) {

 
      // Push in string code to d3tables array to render table name as a row
      d3Tables.push(`${tableModel.Name} [label=<
        <table border ="0" cellborder ="1" cellspacing = "0" color = "white">
        <tr><td ALIGN = "LEFT" bgcolor = "#232d95"><b><font color = "white">${tableModel.Name}</font></b></td></tr>
        `)

      for (let i = 0; i < tableModel.Properties.length; i++) {
        // Render columns from the database that appear as rows on the table
        // If primary key or foreign key, add label to the row 
        if (CheckSpecialKey(tableModel.Properties[i])) {
          d3Tables.push(`
          <tr>
  
          <td ALIGN = "LEFT" bgcolor = "gray25" port="${tableModel.Properties[i].Name.split(' ')[0]}"><font color = "#e2c044">${CheckSpecialKey(tableModel.Properties[i])} </font> | <font color = "white"> ${tableModel.Properties[i].Name}</font></td></tr>
          `)
        } else {
          d3Tables.push(`
          <tr><td ALIGN = "LEFT" bgcolor = "gray25" port ="${tableModel.Properties[i].Name.split(' ')[0]}"><font color = "white">          ${tableModel.Properties[i].Name}</font></td></tr>
          `)
        }

      }
      // Ending block for each table once the relevant rows/columns have been appended
      d3Tables.push(`
      </table>>];
      `)

    });
     /*  
      Loop through foreign keys for parsing relationships and drawing out 
      arrows with graphviz to depict how tables are related
     */
    foreignKeyList.forEach(ForeignKeyModel => {
      if (!ForeignKeyModel.IsDestination) {
        // d3Tables.push(`
        //   ${ForeignKeyModel.ReferencesTableName}:${ForeignKeyModel.ReferencesPropertyName} -> 
        //   ${ForeignKeyModel.PrimaryKeyTableName}:${ForeignKeyModel.PrimaryKeyName.split(' ')[0]} [color = lightseagreen]
        // `)
        d3Tables.push(`
        ${ForeignKeyModel.PrimaryKeyTableName}:${ForeignKeyModel.PrimaryKeyName.split(' ')[0]} -> 
          ${ForeignKeyModel.ReferencesTableName}:${ForeignKeyModel.ReferencesPropertyName} [color = "#5ea54a"]
        `)
      }
    })
    // Closing curly brace for ending out graphviz syntax
    d3Tables.push('}')
    // Combine array to form a string for graphviz syntax
    const diagraphString = d3Tables.join('');
    console.log(diagraphString);
    // Select #graph div and render the graph
    d3.select("#graph")
      .graphviz()
      .renderDot(diagraphString)
  };


  // Event Listeners

  // Update diagrams on parseButton click
  parseButton.addEventListener('click', () => {
    // Remove any existing graphs to avoid duplicate rendering
    while (graph.firstChild) {
      graph.removeChild(graph.lastChild)
    }
    parseSql(sqlInput.value)
  })

  // Webview panel listens for messages from extension
  let counter = 0;
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
      // If message.command = sendText, reassign sqlInput value to message.text
      case 'sendText':
        sqlInput.value = message.text;
        // If first time receiving sentText message, invoke parseSql
        if (counter === 0) {
          counter++;
          parseSql(sqlInput.value);
        }
        break;
    }
  });

});
