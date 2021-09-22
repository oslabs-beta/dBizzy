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

    var foreignKeyLabelIndex = name.toLowerCase().indexOf('foreign key');
    console.log(foreignKeyLabelIndex)
    var foreignKey = name.slice(0, foreignKeyLabelIndex).trim();
    console.log(foreignKey)
    var primaryKeyLabelIndex = name.toLowerCase().indexOf('primary key');
    console.log(primaryKeyLabelIndex)
    if (primaryKeyLabelIndex >= 0) {
      foreignKey = foreignKey.slice(0, primaryKeyLabelIndex).trim();
    };

    // var referencesSQL = name.substring(referencesIndex, name.length);
    var alterTableName = name.substring(0, name.indexOf("WITH")).replace('ALTER TABLE ', '');
    console.log(foreignKey)
    if (referencesIndex !== -1 /*  && alterTableName !== '' */) {

      //Create ForeignKey
      var foreignKeyOriginModel = CreateForeignKey(foreignKey, currentTableModel.Name, referencedPropertyName, referencedTableName, false);

      //Add ForeignKey Origin
      foreignKeyList.push(foreignKeyOriginModel);

      //Create ForeignKey
      var foreignKeyDestinationModel = CreateForeignKey(referencedPropertyName, referencedTableName, foreignKey, currentTableModel.Name, true);

      //Add ForeignKey Destination
      foreignKeyList.push(foreignKeyDestinationModel);

      //Create Property
      var propertyModel = CreateProperty(foreignKey, currentTableModel.Name, null, false);

      if (propertyType === 'SQLServer both') {
        propertyModel.IsPrimaryKey = true;
      }

      //Add Property to table
      currentTableModel.Properties.push(propertyModel);
    }
  };

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

  function AssignForeignKey(foreignKeyModel) {
    // ForeignKeyModel
      // isDestination
      // PrimaryKeyName
      // PrimaryKeyTableName
      // ReferencesPropertyName
      // ReferencesTableName
    console.log('trying to assign foreign key')
    tableList.forEach(function (tableModel) {
      if (tableModel.Name === foreignKeyModel.ReferencesTableName) {
        tableModel.Properties.forEach(function (propertyModel) {
          if (propertyModel.Name === foreignKeyModel.ReferencesPropertyName) {
            console.log('pushing foreignmodel into references', propertyModel.Name, foreignKeyModel)
            propertyModel.IsForeignKey = true;
            propertyModel.References.push(foreignKeyModel);
          }
        });
      }

      // if (tableModel.Name === foreignKeyModel.PrimaryKeyTableName) {
      //   tableModel.Properties.forEach(function (propertyModel) {
      //     if (propertyModel.Name === foreignKeyModel.PrimaryKeyName) {
      //       propertyModel.IsForeignKey = true;
      //       propertyModel.ForeignKey.push(foreignKeyModel);
      //     }
      //   });
      // }
    });
  }

  function ProcessForeignKey() {
    foreignKeyList.forEach(function (foreignKeyModel) {
      //Assign ForeignKey
      AssignForeignKey(foreignKeyModel);
    });
  }

  function CreateForeignKey(primaryKeyName, primaryKeyTableName, referencesPropertyName, referencesTableName, isDestination) {
    var foreignKey = new ForeignKeyModel;

    foreignKey.PrimaryKeyTableName = primaryKeyTableName;
    foreignKey.PrimaryKeyName = primaryKeyName;
    foreignKey.ReferencesPropertyName = referencesPropertyName;
    foreignKey.ReferencesTableName = referencesTableName;
    foreignKey.IsDestination = (isDestination !== undefined && isDestination !== null) ? isDestination : false;

    return foreignKey;
  };

  function CreatePrimaryKey(primaryKeyName, primaryKeyTableName) {
    var primaryKey = new PrimaryKeyModel;

    primaryKey.PrimaryKeyTableName = primaryKeyTableName;
    primaryKey.PrimaryKeyName = primaryKeyName;

    return primaryKey;
  };

  function CreateProperty(name, tableName, foreignKey, isPrimaryKey) {
    var property = new PropertyModel;
    var isForeignKey = foreignKey !== undefined && foreignKey !== null;

    property.Name = name;
    property.TableName = tableName;
    property.IsForeignKey = isForeignKey;
    property.IsPrimaryKey = isPrimaryKey;

    return property;
  };

  function CreateTable(name) {
    var table = new TableModel;

    table.Name = name;

    //Count exported tables
    exportedTables++;

    return table;
  };

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

  function ParseTableName(name) {
    if (name.charAt(name.length - 1) === '(') {
      name = ParseSQLServerName(name);
    }

    return name;
  };

  function parseSql(text) {
    var lines = text.split('\n');

    tableCell = null;
    cells = [];
    exportedTables = 0;
    tableList = [];
    foreignKeyList = [];

    var currentTableModel = null;

    //Parse SQL to objects
    for (var i = 0; i < lines.length; i++) {

      rowCell = null;

      var tmp = lines[i].trim();

      var propertyRow = tmp.substring(0, 12).toLowerCase();

      if (currentTableModel !== null && tmp.includes(');')) {
        tableList.push(currentTableModel);
        currentTableModel = null;
      }

      //Parse Table
      if (propertyRow === 'create table') {

        //Parse row
        var name = tmp.substring(12).trim();

        //Parse Table Name
        name = ParseTableName(name);


        //Create Table
        currentTableModel = CreateTable(name);
      }

      // Parse Properties 
      else if (tmp !== '(' && currentTableModel != null && propertyRow !== 'alter table ') {

        //Parse the row
        var name = tmp.substring(0, (tmp.charAt(tmp.length - 1) === ',') ? tmp.length - 1 : tmp.length);
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
        //Verify if this is a property that doesn't have a relationship (One minute of silence for the property)
        var normalProperty = propertyType !== 'primary key' && propertyType !== 'foreign key' && propertyType !== 'SQLServer primary key' && propertyType !== 'SQLServer foreign key' && propertyType !== 'SQLServer both';

        //Parse properties that don't have relationships
        if (normalProperty) {

          if (name === '' || name === "" || name === ");") {
            continue;
          }

          //Create Property
          var propertyModel = CreateProperty(name, currentTableModel.Name, null, false, false);

          //Add Property to table
          currentTableModel.Properties.push(propertyModel);
        }

        //Parse Primary Key
        if (propertyType === 'primary key' || propertyType === 'SQLServer primary key' || propertyType === 'SQLServer both') {
          if (propertyType === 'SQLServer primary key' || propertyType === 'SQLServer both') {
            var start = i + 2;
            var end = 0;
            if (name.indexOf('PRIMARY KEY') !== -1 && name.indexOf('CLUSTERED') === -1) {
              var primaryKey = name.replace('PRIMARY KEY (', '')
                .replace(')', '')
                .replace('PRIMARY KEY', '')
                .trim();


              if (propertyType === 'SQLServer both') {
                  console.log(primaryKey)
              }
              //Create Primary Key
              var primaryKeyModel = CreatePrimaryKey(primaryKey, currentTableModel.Name);

              //Add Primary Key to List
              primaryKeyList.push(primaryKeyModel);

              //Create Property
              var propertyModel = CreateProperty(primaryKey, currentTableModel.Name, null, true);

              //Add Property to table
              if (propertyType !== 'SQLServer both') {
                currentTableModel.Properties.push(propertyModel);
              }
            } 
            
          } else if (propertyType === 'primary key') {
            var primaryKeyName = name.slice(13).replace(')', '');
            currentTableModel.Properties.forEach(property => {
              if (property.Name.split(' ')[0] === primaryKeyName) {
                property.IsPrimaryKey = true;
                primaryKeyList.push(property);
              }
            })

          }

        }

        //Parse Foreign Key
        if (propertyType === 'foreign key' || propertyType === 'SQLServer foreign key' || propertyType === 'SQLServer both') {
          console.log(propertyType)
          if (propertyType === 'SQLServer foreign key' || propertyType === 'SQLServer both') {
            var completeRow = name;
            if (propertyType === 'SQLServer both') {
              console.log(completeRow)
            }
            if (name.indexOf('REFERENCES') === -1) {
              var referencesRow = (lines[i + 1]).trim();
              completeRow = 'ALTER TABLE [dbo].[' + currentTableModel.Name + ']  WITH CHECK ADD' + ' ' + name + ' ' + referencesRow;
            }
            ParseSQLServerForeignKey(completeRow, currentTableModel, propertyType);
          }
          else {
            console.log('foreign key row: ', name);
            let foreignKeyName = name.match(/(?<=FOREIGN\sKEY\s)(\([a-zA-Z_]+\))(?=\sREFERENCES\s)/)[0].replace(/\(|\)/g, '');
            console.log(foreignKeyName);
            const referencedTableName = name.match(/(?<=REFERENCES\s)([a-zA-Z_]+)(?=\()/)[0];
            console.log(referencedTableName);
            const referencedPropertyName = name.match(/(?<=REFERENCES\s[a-zA-Z_]+)(\([a-zA-Z_]+\))/)[0].replace(/\(|\)/g, '');
            console.log(referencedPropertyName);

            // Look through current table and reassign isForeignKey prop to true, reassign foreignKeyName to include type
            currentTableModel.Properties.forEach(property => {
              if (property.Name.split(' ')[0] === foreignKeyName) {
                property.IsForeignKey = true;
                foreignKeyName = property.Name;
              }
            })

             //Create ForeignKey
            var foreignKeyOriginModel = CreateForeignKey(foreignKeyName, currentTableModel.Name, referencedPropertyName, referencedTableName, false);

            // Add ForeignKey Origin
            foreignKeyList.push(foreignKeyOriginModel);

            //Create ForeignKey
            var foreignKeyDestinationModel = CreateForeignKey(referencedPropertyName, referencedTableName, foreignKeyName, currentTableModel.Name, true);

            //Add ForeignKey Destination
            foreignKeyList.push(foreignKeyDestinationModel);
          }
        }
      } 
    }

    //Process Primary Keys
    ProcessPrimaryKey();
    console.log('primaryKeyList: ', primaryKeyList)
    //Process Foreign Keys
    ProcessForeignKey();
    console.log('foreignKeyList: ', foreignKeyList)
    //Create Table in UI
    console.log('tableList: ', tableList);
    CreateTableUI();

  };

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


  function CreateTableUI() {
    // initial opening string for the rendering of the diagram.
    let d3Tables = [`digraph G { bgcolor = "none"
      graph [   rankdir = "LR" ];

      node [fontsize = 10 fontname = "opensans" shape=plain]`];

    tableList.forEach(function (tableModel) {

 
      // push in string code to d3tables array to render table name as a row
      d3Tables.push(`${tableModel.Name} [label=<
        <table border ="0" cellborder ="1" cellspacing = "0" color = "white">
        <tr><td ALIGN = "LEFT" bgcolor = "midnightblue"><b><font color = "white">${tableModel.Name}</font></b></td></tr>
        `)

      for (let i = 0; i < tableModel.Properties.length; i++) {
        // render columns from the database that appear as rows on the table
        // if special key, add label to the row
        if (CheckSpecialKey(tableModel.Properties[i])) {
          d3Tables.push(`
          <tr>
  
          <td ALIGN = "LEFT" bgcolor = "gray25" port="${tableModel.Properties[i].Name.split(' ')[0]}"><font color = "darkgoldenrod">${CheckSpecialKey(tableModel.Properties[i])} </font> | <font color = "white"> ${tableModel.Properties[i].Name}</font></td></tr>
          `)
        } else {
          d3Tables.push(`
          <tr><td ALIGN = "LEFT" bgcolor = "gray25" port ="${tableModel.Properties[i].Name.split(' ')[0]}"><font color = "white">          ${tableModel.Properties[i].Name}</font></td></tr>
          `)
        }

      }
      // ending block for each table once the relevant rows/columns have been appended
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
        d3Tables.push(`
        ${ForeignKeyModel.ReferencesTableName}:${ForeignKeyModel.ReferencesPropertyName} -> 
    ${ForeignKeyModel.PrimaryKeyTableName}:${ForeignKeyModel.PrimaryKeyName.split(' ')[0]} [color = lightseagreen]
        `)
      }
    })
    // closing curly brace for ending out graphviz syntax
    d3Tables.push('}')
    // combine array to form a string for graphviz syntax
    const diagraphString = d3Tables.join('');
    console.log(diagraphString);
    // select #graph div and render the graph
    d3.select("#graph")
      .graphviz()
      .renderDot(diagraphString)
  };


  // Event Listeners
  parseButton.addEventListener('click', () => {
    while (graph.firstChild) {
      graph.removeChild(graph.lastChild)
    }
    parseSql(sqlInput.value)
  })

  let counter = 0;
  // maybe just change to click
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
      case 'sendText':
        sqlInput.value = message.text;
        if (counter === 0) {
          counter++;
          parseSql(sqlInput.value);
        }
        break;
    }
  });

});
