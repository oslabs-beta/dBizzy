document.addEventListener('DOMContentLoaded', () => {
  const body = document.querySelector('body');
  const graph = document.querySelector('#graph');
  
  const parseButton = document.createElement('button');
  parseButton.setAttribute('id', 'sqlParseButton');
  parseButton.innerText = 'Update Diagrams';
  body.prepend(parseButton);

  //Create textarea for SQL Query
  var sqlInput = document.createElement('textarea');
  sqlInput.setAttribute('id', 'sqlInput');
  sqlInput.setAttribute('readonly', 'true');
  sqlInput.style.display = 'none';
  sqlInput.style.height = '200px';
  sqlInput.style.width = '100%';
  sqlInput.value = 'CREATE TABLE Persons\n(\nPersonID int PRIMARY KEY,\nLastName varchar(255),\n' +
    'FirstName varchar(255),\nAddress varchar(255),\nCity varchar(255)\n);';
  body.prepend(sqlInput);

  
  // const resetButton = document.getElementById('reset');

  // const tableArea = document.createElement('div');
  // tableArea.setAttribute('class', 'tableArea');



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

  //SQL Types
  var SQLServer = 'sqlserver';

  //var MODE_SQLSERVER = null;

  //Table Info
  var foreignKeyList = [];
  var primaryKeyList = [];
  var tableList = [];




  // function readTextFile(file) {
  //   var rawFile = new XMLHttpRequest();
  //   rawFile.open("GET", file, false);
  //   rawFile.onreadystatechange = function () {
  //     if(rawFile.readyState === 4) {
  //       if(rawFile.status === 200 || rawFile.status == 0) {
  //         var allText = rawFile.responseText;
  //         sqlInput.value = allText;
  //       }
  //     }
  //   }
  // }

  // setInterval(readTextFile(path.resolve(__dirname, './sample.sql'), 2000);


  function ParseSQLServerForeignKey(name, currentTableModel) {
    console.log('Found Foreign Key Query: ', name)
    // Regex expression to find referenced foreign table 
    var referencesIndex = name.match(/(?<=REFERENCES\s)([a-zA-Z_]+)(\([a-zA-Z_]*\))/);
    const referencedTableName = referencesIndex[1];
    const referencedPropertyName = referencesIndex[2].replace(/\(|\)/g, '');

    var foreignKeyLabelIndex = name.toLowerCase().indexOf('foreign key');
    var foreignKey = name.slice(0, foreignKeyLabelIndex).trim();

    // var referencesSQL = name.substring(referencesIndex, name.length);
    var alterTableName = name.substring(0, name.indexOf("WITH")).replace('ALTER TABLE ', '');

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
      if (!MODE_SQLSERVER) {
        name = name.substring(0, name.lastIndexOf(' '));
      } else {
        name = ParseSQLServerName(name);
      }
    }

    return name;
  };

  function parseSql(text, type) {
    var lines = text.split('\n');

    console.log('LINES:', lines)

    // Only able to parse SQL Server syntax
    MODE_SQLSERVER = type !== undefined && type !== null && type == SQLServer;

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

        // if (currentTableModel !== null) {
        //   //Add table to the list
        //   tableList.push(currentTableModel);
        // }

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
          if (tmp.indexOf("PRIMARY KEY") !== -1) {
            propertyType = "SQLServer primary key";
          }

          if (tmp.indexOf("FOREIGN KEY") !== -1) {
            propertyType = "SQLServer foreign key";
          }
        }
        //Verify if this is a property that doesn't have a relationship (One minute of silence for the property)
        var normalProperty = propertyType !== 'primary key' && propertyType !== 'foreign key' && propertyType !== 'SQLServer primary key' && propertyType !== 'SQLServer foreign key';

        //Parse properties that don't have relationships
        if (normalProperty) {

          if (name === '' || name === "" || name === ");") {
            continue;
          }

          if (MODE_SQLSERVER) {
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
              name.indexOf("REFERENCES") !== -1) {
              continue;
            }
          }


          //Create Property
          var propertyModel = CreateProperty(name, currentTableModel.Name, null, false, false);

          //Add Property to table
          currentTableModel.Properties.push(propertyModel);
        }

        //Parse Primary Key
        if (propertyType === 'primary key' || propertyType === 'SQLServer primary key') {
          if (propertyType === 'SQLServer primary key') {
            console.log(propertyType)
            var start = i + 2;
            var end = 0;
            if (name.indexOf('PRIMARY KEY') !== -1 && name.indexOf('CLUSTERED') === -1) {
              var primaryKey = name.replace('PRIMARY KEY (', '')
                .replace(')', '')
                .replace('PRIMARY KEY', '')
                .trim();

              //Create Primary Key
              var primaryKeyModel = CreatePrimaryKey(primaryKey, currentTableModel.Name);

              //Add Primary Key to List
              primaryKeyList.push(primaryKeyModel);

              //Create Property
              var propertyModel = CreateProperty(primaryKey, currentTableModel.Name, null, true);

              //Add Property to table
              currentTableModel.Properties.push(propertyModel);

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
        if (propertyType === 'foreign key' || propertyType === 'SQLServer foreign key') {
          console.log(propertyType)
          if (propertyType === 'SQLServer foreign key') {
            var completeRow = name;

            if (name.indexOf('REFERENCES') === -1) {
              var referencesRow = (lines[i + 1]).trim();
              completeRow = 'ALTER TABLE [dbo].[' + currentTableModel.Name + ']  WITH CHECK ADD' + ' ' + name + ' ' + referencesRow;
            }
            ParseSQLServerForeignKey(completeRow, currentTableModel);
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

      } else if (propertyRow === 'alter table ') {

        if (MODE_SQLSERVER) {
          //Parse the row
          var alterTableRow = tmp.substring(0, (tmp.charAt(tmp.length - 1) === ',') ? tmp.length - 1 : tmp.length);
          var referencesRow = (lines[i + 1]).trim();
          var completeRow = alterTableRow + ' ' + referencesRow;

          ParseSQLServerForeignKey(completeRow, currentTableModel);
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
      return 'PK | FK';
    }
    if (propertyModel.IsForeignKey) {
      return 'FK';
    }
    if (propertyModel.IsPrimaryKey) {
      return 'PK';
    }
    else {
      return '';
    }
  }

  // function getRandomColor() {
  //   var letters = '0123456789ABCDEF';
  //   var color = '#';
  //   for (var i = 0; i < 6; i++) {
  //     color += letters[Math.floor(Math.random() * 16)];
  //   }
  //   return color;
  // }

  // .renderDot((d) => 'digraph <table>');
  function CreateTableUI() {
    // initial opening string for the rendering of the diagram.
    let d3Tables = [`digraph G {
      graph [   rankdir = "LR" ];
      node [shape=plain]`];
    // // caching being used for previous method of color scheming PK/FK relationships
    // const cache = {};

    // foreignKeyList.forEach(ForeignKeyModel => {
    //   if (ForeignKeyModel.IsDestination) {
    //     cache[ForeignKeyModel.PrimaryKeyName] = getRandomColor();
    //   }
    // })
    
    tableList.forEach(function (tableModel) {
      // // append strings or append to array to render final graphviz;
      // const table = document.createElement('table');
      // table.setAttribute('class', 'table');

      // push in string code to d3tables array to render table name as a row
      d3Tables.push(`${tableModel.Name} [label=<
        <table border ="0" cellborder ="1" cellspacing = "0">
        <tr><td><b>${tableModel.Name}</b></td></tr>
        `)
      // // Add table name
      // const tableName = document.createElement('th');
      // tableName.setAttribute('class', 'tableName');
      // tableName.innerText = tableModel.Name;

      // table.appendChild(tableName);

      // tableArea.appendChild(table)

      for (let i = 0; i < tableModel.Properties.length; i++) {
        // render rows
        // if special key, add label to the row
        if (CheckSpecialKey(tableModel.Properties[i])) {
          d3Tables.push(`
          <tr><td port="${tableModel.Properties[i].Name.split(' ')[0]}">${CheckSpecialKey(tableModel.Properties[i])} | ${tableModel.Properties[i].Name}</td></tr>
          `)
        } else {
          d3Tables.push(`
          <tr><td port ="${tableModel.Properties[i].Name.split(' ')[0]}">${tableModel.Properties[i].Name}</td></tr>
          `)
        }
        // const row = document.createElement('tr');
        // row.setAttribute('class', 'row');

        // const sb = document.createElement('td');
        // sb.setAttribute('class', 'sb');
        // sb.innerText = CheckSpecialKey(tableModel.Properties[i]);
        // if (sb.innerText.includes('FK')) {
        //   let references = tableModel.Properties[i].References[0].PrimaryKeyName;
        //   sb.style.color = cache[references];
        // }
        // const property = document.createElement('td');
        // property.setAttribute('class', 'property');
        // property.innerText = tableModel.Properties[i].Name;
        // const propertyName = tableModel.Properties[i].Name.split(' ')[0];
        // if(cache[propertyName] && !sb.innerText.includes('FK')) {
        //   property.style.color = cache[propertyName];
        // }
        // row.appendChild(sb);
        // row.appendChild(property);

        // table.appendChild(row);
      }
      // tableArea.appendChild(table);
      // ending block for each table outside of the properties for loop 
      d3Tables.push(`
      </table>>];
      `)

    });
    // ARROW FUNCTION
    // Loop through foreign keys for parsing relationships and drawing out arrows with graphviz
    foreignKeyList.forEach(ForeignKeyModel => {
      if (!ForeignKeyModel.IsDestination) {
        d3Tables.push(`
        ${ForeignKeyModel.ReferencesTableName}:${ForeignKeyModel.ReferencesPropertyName} -> 
    ${ForeignKeyModel.PrimaryKeyTableName}:${ForeignKeyModel.PrimaryKeyName.split(' ')[0]}
        `)
      }
    })
    d3Tables.push('}')
    const diagraphString = d3Tables.join('');
    console.log(diagraphString);
    d3.select("#graph")
      .graphviz()
      .renderDot(diagraphString)
  };

  // body.appendChild(tableArea);
  // Event Listeners
  parseButton.addEventListener('click', () => {
    
    while (graph.firstChild) {
      graph.removeChild(graph.lastChild)
    }
    const sqlInputField = document.querySelector('#sqlInput');
    parseSql(sqlInputField.value, SQLServer)
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
          parseSql(sqlInput.value, SQLServer);
        }
        break;
    }
  });

});
