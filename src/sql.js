
document.addEventListener('DOMContentLoaded', () => {
  const body = document.querySelector('body');



  //Create textarea for SQL Query
  var sqlInput = document.createElement('textarea');
  sqlInput.setAttribute('id', 'sqlInput');
  // sqlInput.setAttribute('readonly', 'true');
  // sqlInput.style.display = 'none';
  sqlInput.style.height = '200px';
  sqlInput.style.width = '100%';
  sqlInput.value = 'CREATE TABLE Persons\n(\nPersonID int PRIMARY KEY,\nLastName varchar(255),\n' +
    'FirstName varchar(255),\nAddress varchar(255),\nCity varchar(255)\n);';
  body.appendChild(sqlInput);

  const parseButton = document.createElement('button');
  parseButton.setAttribute('id', 'sqlParseButton');
  parseButton.innerText = 'Update Diagrams';
  body.appendChild(parseButton);
  const resetButton = document.getElementById('reset');

  const tableArea = document.createElement('div');
  tableArea.setAttribute('class', 'tableArea');



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
    console.log('referencesIndex: ', referencesIndex);
    const referencedTableName = referencesIndex[1];
    const referencedPropertyName = referencesIndex[2].replace(/\(|\)/g, '');
    console.log('referencedTableName: ', referencedTableName);
    console.log('referencedPropertyName: ', referencedPropertyName);

    var foreignKeyLabelIndex = name.toLowerCase().indexOf('foreign key');
    var foreignKey = name.slice(0, foreignKeyLabelIndex).trim();
    console.log('Foreign Key Name: ', foreignKey);

    // var rIndex = name.toLowerCase().indexOf('references') + 10;
    // let slicedName = name.slice(rIndex);
    // // let matches = slicedName.match('')
    // console.log('sliced name', slicedName);
    // var referencedTable = slicedName.slice(0, slicedName.indexOf('(')).trim();
    // console.log('found reference table', referencedTable)
    // var referencedTableColumn = slicedName.slice(slicedName.indexOf('(') + 1, slicedName.indexOf(')')).trim();
    // console.log('referenced column is  ', referencedTableColumn);


    // if (name.toLowerCase().indexOf("foreign key") !== -1) {
    //   var foreignKeySQL = name.substring(name.toLowerCase().indexOf("foreign key"), referencesIndex).replace("FOREIGN KEY(", '').replace(')', '');
    //   console.log('ParsedForeignKey', foreignKeySQL);
    // } else {
    //   var foreignKeySQL = name.substring(name.toLowerCase().indexOf("foreign key ("), referencesIndex).replace("FOREIGN KEY (", '').replace(')', '');
    // }

    // var referencesSQL = name.substring(referencesIndex, name.length);
    var alterTableName = name.substring(0, name.indexOf("WITH")).replace('ALTER TABLE ', '');

    if (referencesIndex !== -1 /*  && alterTableName !== '' */) {

      // //Remove references syntax
      // referencesSQL = referencesSQL.replace("REFERENCES ", '');

      //Get Table and Property Index
      // var referencedTableIndex = referencesSQL.indexOf("(");
      // var referencedPropertyIndex = referencesSQL.indexOf(")");

      // //Get Referenced Table
      // var referencedTableName = referencesSQL.substring(0, referencedTableIndex);

      // //Parse Name
      // referencedTableName = ParseSQLServerName(referencedTableName);

      // //Get Referenced Key
      // var referencedPropertyName = referencesSQL.substring(referencedTableIndex + 1, referencedPropertyIndex);

      // //Parse Name
      // referencedPropertyName = ParseSQLServerName(referencedPropertyName);

      //Get ForeignKey 
      // var foreignKey = foreignKeySQL.replace("FOREIGN KEY (", '').replace(")", '');

      // //Parse Name
      // foreignKey = ParseSQLServerName(foreignKey);

      // //Parse Name
      // alterTableName = ParseSQLServerName(alterTableName);

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
    tableList.forEach(function (tableModel) {
      if (tableModel.Name === foreignKeyModel.ReferencesTableName) {
        tableModel.Properties.forEach(function (propertyModel) {
          if (propertyModel.Name === foreignKeyModel.ReferencesPropertyName) {
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
    console.log('ForeignKeyList', foreignKeyList)
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

      //Parse Table
      if (propertyRow === 'create table') {

        //Parse row
        var name = tmp.substring(12).trim();

        //Parse Table Name
        name = ParseTableName(name);

        if (currentTableModel !== null) {
          //Add table to the list
          tableList.push(currentTableModel);
        }

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
        if (MODE_SQLSERVER) {
          if (/* tmp.indexOf("CONSTRAINT") !== -1 && */ tmp.indexOf("PRIMARY KEY") !== -1) {
            propertyType = "constrain primary key";
          }

          if (/*tmp.indexOf("CONSTRAINT") !== -1 && */ tmp.indexOf("FOREIGN KEY") !== -1) {
            console.log('found foreign key')
            propertyType = "constrain foreign key";
          }
        }

        //Verify if this is a property that doesn't have a relationship (One minute of silence for the property)
        var normalProperty = propertyType !== 'primary key' && propertyType !== 'foreign key' && propertyType !== 'constrain primary key' && propertyType !== 'constrain foreign key';

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
        if (propertyType === 'primary key' || propertyType === 'constrain primary key') {
          if (!MODE_SQLSERVER) {
            var primaryKey = name.replace('PRIMARY KEY (', '').replace(')', '');

            //Create Primary Key
            var primaryKeyModel = CreatePrimaryKey(primaryKey, currentTableModel.Name);

            //Add Primary Key to List
            primaryKeyList.push(primaryKeyModel);

          } else {
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

            } else {
              while (end === 0) {
                var primaryKeyRow = (lines[start]).trim();

                if (primaryKeyRow.indexOf(')') !== -1) {
                  end = 1;
                  break;
                }

                start++;

                primaryKeyRow = primaryKeyRow.replace("ASC", '');

                //Parse name
                primaryKeyRow = ParseSQLServerName(primaryKeyRow, true);

                //Create Primary Key
                var primaryKeyModel = CreatePrimaryKey(primaryKeyRow, currentTableModel.Name);

                //Add Primary Key to List
                primaryKeyList.push(primaryKeyModel);
              }
            }

          }

        }

        //Parse Foreign Key
        if (propertyType === 'foreign key' || propertyType === 'constrain foreign key') {
          if (SQLServer) {
            var completeRow = name;

            if (name.indexOf('REFERENCES') === -1) {
              var referencesRow = (lines[i + 1]).trim();
              completeRow = 'ALTER TABLE [dbo].[' + currentTableModel.Name + ']  WITH CHECK ADD' + ' ' + name + ' ' + referencesRow;
            }

            ParseSQLServerForeignKey(completeRow, currentTableModel);
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

    //Add last table
    if (currentTableModel !== null) {
      //Add table to the list
      tableList.push(currentTableModel);
    }

    //Process Primary Keys
    ProcessPrimaryKey();

    //Process Foreign Keys
    ProcessForeignKey();

    //Create Table in UI
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

  function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  // need to implement is referenced
  // need to implement multiple fk pointing to property

  // .renderDot((d) => 'digraph <table>');
  function CreateTableUI() {
    // initial opening string for the rendering of the diagram.
    let d3Tables = [`digraph G { bgcolor = "none"
      graph [   rankdir = "LR" ];
      node [fontsize = 10 fontname = "opensans" shape=plain]`];
    // caching being used for previous method of color scheming PK/FK relationships
    const cache = {};

    foreignKeyList.forEach(ForeignKeyModel => {
      if (ForeignKeyModel.IsDestination) {
        cache[ForeignKeyModel.PrimaryKeyName] = getRandomColor();
      }
    })

    console.log('cache: ', cache)
    console.log(tableList)
    tableList.forEach(function (tableModel) {
      // append strings or append to array to render final graphviz;
      const table = document.createElement('table');
      table.setAttribute('class', 'table');

      // push in string code to d3tables array to render table name as a row
      d3Tables.push(`${tableModel.Name} [label=<
        <table border ="0" cellborder ="1" cellspacing = "0" color = "white">
        <tr><td ALIGN = "LEFT" bgcolor = "midnightblue"><b><font color = "white">${tableModel.Name}</font></b></td></tr>
        `)
      // Add table name
      const tableName = document.createElement('th');
      tableName.setAttribute('class', 'tableName');
      tableName.innerText = tableModel.Name;

      table.appendChild(tableName);

      tableArea.appendChild(table)

      for (let i = 0; i < tableModel.Properties.length; i++) {
        // render rows
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
        const row = document.createElement('tr');
        row.setAttribute('class', 'row');

        const sb = document.createElement('td');
        sb.setAttribute('class', 'sb');
        sb.innerText = CheckSpecialKey(tableModel.Properties[i]);
        if (sb.innerText.includes('FK')) {
          let references = tableModel.Properties[i].References[0].PrimaryKeyName;
          console.log('References: ', references, cache[references]);
          sb.style.color = cache[references];
        }
        const property = document.createElement('td');
        property.setAttribute('class', 'property');
        property.innerText = tableModel.Properties[i].Name;
        const propertyName = tableModel.Properties[i].Name.split(' ')[0];
        console.log('PROPERTYNAME', propertyName)
        if (cache[propertyName]) {
          property.style.color = cache[propertyName];
        }
        row.appendChild(sb);
        row.appendChild(property);

        table.appendChild(row);
      }
      tableArea.appendChild(table);
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
    ${ForeignKeyModel.PrimaryKeyTableName}:${ForeignKeyModel.PrimaryKeyName.split(' ')[0]} [color = lightseagreen]
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

  body.appendChild(tableArea);
  // Event Listeners
  parseButton.addEventListener('click', () => {
    while (tableArea.firstChild) {
      tableArea.removeChild(tableArea.lastChild)
    }
    const sqlInputField = document.querySelector('#sqlInput');
    parseSql(sqlInputField.value, SQLServer)
  })


  // maybe just change to click
  window.addEventListener('message', event => {
    // while (tableArea.firstChild) {
    //   tableArea.removeChild(tableArea.lastChild)
    // }
    const message = event.data;
    switch (message.command) {
      case 'sendText':
        sqlInput.value = message.text;
        // parseSql(sqlInput.value, 'sqlserver');
        break;
    }
  });

});
