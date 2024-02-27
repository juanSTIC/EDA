import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { EdaBlankPanelComponent } from '@eda/components/eda-panels/eda-blank-panel/eda-blank-panel.component';
import { Column } from '@eda/models/model.index';
import { TableUtils } from './tables-utils';
import * as _ from 'lodash';

export const PanelInteractionUtils = {

  /**
     * loads columns from table
     * @param table  
     */
  loadColumns2: (ebp: EdaBlankPanelComponent, table: any) => {
    ebp.userSelectedTable = table.table_name;
    ebp.disableBtnSave();
    // Clean columns
    ebp.columns = [];
    table.columns.forEach((c: Column) => {
      c.table_id = table.table_name;
      const matcher = _.find(ebp.currentQuery, (x: Column) => c.table_id === x.table_id && c.column_name === x.column_name && c.display_name.default === x.display_name.default );
      if (!matcher) ebp.columns.push(c);
      ebp.columns = ebp.columns.filter(col => col.visible === true)
        .sort((a, b) => (a.display_name.default > b.display_name.default) ? 1 : ((b.display_name.default > a.display_name.default) ? -1 : 0));
    });

    if (!_.isEqual(ebp.inputs.findTable.ngModel, '')) {
      ebp.inputs.findTable.reset();
      ebp.setTablesData();
    }
  },

  loadColumns: (ebp: EdaBlankPanelComponent, table: any, treeClick?:boolean) => {
    // Set the user-selected table and disable the save button
    ebp.userSelectedTable = table.table_name;
    ebp.disableBtnSave();

    // Clean columns
    const filteredColumns = table.columns.filter((tableColumn: Column) => {
      tableColumn.table_id = table.table_name;

        const matcher = ebp.currentQuery.find((currentColumn: Column) =>
          tableColumn.table_id === currentColumn.table_id &&
          tableColumn.column_name === currentColumn.column_name
          && tableColumn.display_name.default === currentColumn.display_name.default
        );

        return !matcher && tableColumn.visible === true;
    });

    // Sort columns by default display name
    ebp.columns = filteredColumns.sort((a, b) => a.display_name.default.localeCompare(b.display_name.default));

    if(!treeClick){
      PanelInteractionUtils.loadTableNodes(ebp);
    }
    // Reset input and update table data if the findTable ngModel is not empty
    if (!_.isEqual(ebp.inputs.findTable.ngModel, '')) {
        // console.log('reset?')
        // ebp.inputs.findTable.reset();
        // ebp.setTablesData();
    }
  },
  
  /**
   * Generate the rootTree for the currentQuery columns
   * @param ebp EdaBlankPanelComponent
   */ 
  loadTableNodes: (ebp: EdaBlankPanelComponent) => {
    if (ebp.currentQuery.length > 0) {
      const idTables = [...new Set(ebp.currentQuery.map((q) => q.table_id))];
      const rootTable = idTables.find((idTable: string) => ebp.rootTreeTable?.table_name == idTable);
      if (rootTable) {
        const dataSource = ebp.inject.dataSource.model.tables;
  
        ebp.tableNodes = [];
    
        const table = dataSource.find((source) => source.table_name == rootTable);
        
        if (table) {
          let isexpandible = table.relations.length > 0;
    
          let node: any = {
            label: table.display_name.default,
            table_id: rootTable
          }
          
          if (isexpandible) {
            node.expandedIcon = "pi pi-folder-open";
            node.collapsedIcon = "pi pi-folder";
            node.children = [{}];
          }
          ebp.tableNodes.push(node);
        }
      }
    }
  },

  assertTable: (ebp: EdaBlankPanelComponent, column: Column) => {
    if (column.joins.length > 0 && !ebp.tables.some((t) => t.table_name == column.table_id)) {
      const rootJoin = column.joins[0];
      const rootTable = (rootJoin[0]||'').split('.')[0];
      const sourceTable = ebp.tables.find((table: any) => table.table_name == rootTable);

      const relation = sourceTable?.relations.find((rel) => `${rel.target_table}.${rel.target_column[0]}` == column.table_id);
      if (relation) {
        let assertTable = _.cloneDeep(ebp.tables.find((t) => t.table_name == relation.target_table));

        let displayName = relation.display_name?.default
          ? `${relation.display_name.default}`
          : ` ${relation.source_column[0]} - ${relation.target_table} `;
        
        if (assertTable?.table_name) {
          assertTable.table_name = column.table_id;
          assertTable.display_name.default = displayName;
          assertTable.description.default = displayName;
          // console.log('assertTable', assertTable);
          ebp.assertedTables.push(assertTable);
          ebp.tables.push(assertTable);
        }
      }
    }
  },

  /**
   * Find all nodes from the expanNode. expandNode can be rootNode or a childNode.
   * Both have the children array property.
   * @param ebp EdaBlankPanelComponent
   * @param expandNode node to find all possible children nodes.
   */ 
  expandTableNode: (ebp: EdaBlankPanelComponent, expandNode: any) => {
    const dataSource = ebp.inject.dataSource.model.tables;
    /** @rootNode have table_id @childNode have child_id ("table_name.column_name")  */
    const table_id = expandNode.table_id || expandNode.child_id.split('.')[0];
    
    if (table_id) {
      expandNode.children = [];

      const table = dataSource.find((source) => source.table_name == table_id);
      
      /** find all the existing childNodes found before */
      const getAllChildIds = (node: any, ids: string[] = []): string[] => {
        if (node.child_id) ids.push(node.child_id);
    
        if (node.parent) return getAllChildIds(node.parent, ids);
    
        return ids;
      };
      
      const rootTree = ebp.tableNodes.map((n) => n.table_id);
      const childrenId = getAllChildIds(expandNode);

      for (const relation of table.relations) {
        // Init child_id
        const child_id = relation.target_table+'.'+relation.target_column[0];

        /** Checks if the current child_node is included before.
         * This prevents duplicated paths.*/
        if (!rootTree.includes(relation.target_table) && !childrenId.includes(child_id)) {
          // Label to show on the treeComponent 
          let childLabel = relation.display_name?.default
          ? `${relation.display_name.default}`
          : ` ${relation.source_column[0]} - ${relation.target_table} `;

          /** This creates the path to relate this node with the previous tables.
           * It will be used later to generate the query. */
          let sourceJoin = relation.source_table+'.'+relation.source_column[0];
          let joins = expandNode.joins ? [].concat(expandNode.joins, [[sourceJoin, child_id]]) : [[sourceJoin, child_id]];
          
          if (!ebp.tables.some((t) => t.table_name == child_id)) {
            let assertTable = _.cloneDeep(ebp.tables.find((t) => t.table_name == relation.target_table))
            if (assertTable?.table_name) {
              assertTable.table_name = child_id;
              assertTable.display_name.default = childLabel;
              assertTable.description.default = childLabel;
              ebp.tables.push(assertTable)
            }
          }
          // Init childNode object
          let childNode: any = {
            type: 'child',
            label: childLabel,
            child_id: child_id.trim(),
            joins
          };

          // Check if the childNode have more possible paths to explore
          if (!childNode.parent) childNode.parent = expandNode;
          let isexpandible = getAllChildIds(childNode).length > 0; //dataSource.find((source) => relation.target_table == source.table_name)?.relations?.length > 0;
          // If it's expandable, we add properties to expand the node. 
          if (isexpandible) {
            childNode.expandedIcon = "pi pi-folder-open";
            childNode.collapsedIcon = "pi pi-folder";
            childNode.children = [{}];
          }
          // Finally add this childNode to expandNode. This will create the tree.
          expandNode.children.push(childNode);
        }
      }
    }
  },

  /**
     * set local and global filters
     * @param column 
     */
  handleFilters: (ebp: EdaBlankPanelComponent, content: any): void => {
    ebp.selectedFilters = _.cloneDeep(content.filters);
    ebp.globalFilters = content.filters.filter(f => f.isGlobal === true);
    ebp.selectedFilters.forEach(filter => { filter.removed = false; });
    ebp.selectedFilters = ebp.selectedFilters.filter(f => f.isGlobal === false);
  },

  handleFilterColumns: (
    ebp: EdaBlankPanelComponent,
    filterList: Array<any>,
    query: Array<any>
  ): void => {
    try{
      filterList.forEach(filter => {
        const table = ebp.tables.filter(table => table.table_name === filter.filter_table)[0];
        const column = table.columns? table.columns.filter(column => column.column_name === filter.filter_column)[0] : [];
        const columnInQuery = query.filter(col => col.column_name === filter.filter_column).length > 0;
        if (!filter.isGlobal && !columnInQuery && column != undefined) {
          ebp.filtredColumns.push(column);
        }
        if(column == undefined){
          console.log('WARNING\nWARING. YOU HAVE A COLUMN IN THE FILTERS NOT PRESENT IN THE MODEL!!!!!!!!!!!!\nWARNING');
          console.log(filter);
        }
      });
    }catch(e){
        console.error('Error loading filters');
        console.error(e);
    }
  },

  handleCurrentQuery: (ebp: EdaBlankPanelComponent): void => {
    const panelContent = ebp.panel.content;
    const currentQuery = panelContent.query.query.fields;
    const queryTables = [...new Set(currentQuery.map((field: any) => field.table_id))];

    for (const idTable of queryTables) {

        const table = ebp.tables.find(t => t.table_name === idTable);
        // Init columns from table
        PanelInteractionUtils.loadColumns(ebp, table);

        for (const contentColumn of panelContent.query.query.fields) {
            const column = ebp.columns.find(c =>
                c.table_id === contentColumn.table_id &&
                c.column_name === contentColumn.column_name &&
                c.display_name.default === contentColumn.display_name
            );
            if (column) {
                column.whatif_column = contentColumn.whatif_column || false;
                column.whatif = contentColumn.whatif || {};
                column.joins = contentColumn.joins || [];
                PanelInteractionUtils.moveItem(ebp, column);
            } else {
                if(contentColumn.table_id === idTable) {
                    let duplicatedColumn = _.cloneDeep(
                      ebp.currentQuery.find(c =>
                            c.table_id === contentColumn.table_id &&
                            c.column_name === contentColumn.column_name
                        )
                    );

                    if(!duplicatedColumn){
                        duplicatedColumn = _.cloneDeep(
                          ebp.columns.find(c =>
                                c.table_id === contentColumn.table_id &&
                                c.column_name === contentColumn.column_name
                            )
                        );
                    }

                    if(duplicatedColumn){
                        duplicatedColumn.display_name.default = contentColumn.display_name;
                        duplicatedColumn.whatif_column = contentColumn.whatif_column || false;
                        duplicatedColumn.whatif = contentColumn.whatif || {};
                        PanelInteractionUtils.handleAggregationType4DuplicatedColumns(ebp, duplicatedColumn);
                        // Moc la columna directament perque es una duplicada.... o no....
                        ebp.currentQuery.push(duplicatedColumn);
                    }
                }
            }
        }
    }
  },

  handleCurrentQuery2: (ebp: EdaBlankPanelComponent): void => {
    if (ebp.panel.content) {
      const fields = ebp.panel.content.query.query.fields;

      for (const contentColumn of fields) {
        const table = ebp.tables.find((table) => table.table_name == contentColumn.table_id);

        if (table && table?.columns) {
          if (!ebp.rootTreeTable && contentColumn.joins.length == 0) {
            ebp.rootTreeTable = table;
          }

          const columns = table.columns;
          columns.forEach((col) => col.table_id = table.table_name);
  
          let column = columns.find((c: Column) =>
            c.table_id === contentColumn.table_id &&
            c.column_name === contentColumn.column_name
            // && c.display_name.default === contentColumn.display_name
          );
          // console.log('assertColumn', contentColumn, column);
          if (!column && contentColumn) {
            if(columns.length > 0) {
              column = ebp.currentQuery.find((c: Column) =>
                c.table_id === contentColumn.table_id &&
                c.column_name === contentColumn.column_name
              );
  
              if (!column?.table_id) {
                column = columns.find((c: Column) =>
                  c.table_id === contentColumn.table_id &&
                  c.column_name === contentColumn.column_name
                );
              }
  
              if(column){
                  const duplicatedColumn = _.cloneDeep(column);
                  duplicatedColumn.display_name.default = contentColumn.display_name;
                  duplicatedColumn.whatif_column = contentColumn.whatif_column || false;
                  duplicatedColumn.whatif = contentColumn.whatif || {};
                  duplicatedColumn.joins = contentColumn.joins || [];
                  PanelInteractionUtils.handleAggregationType4DuplicatedColumns(ebp, duplicatedColumn);
                  // Moc la columna directament perque es una duplicada.... o no....
                  ebp.currentQuery.push(duplicatedColumn);
              }
            }
          } else if (column && contentColumn) {
            column.isdeleted = true;
            const handleColumn = _.cloneDeep(column)
            handleColumn.display_name.default = contentColumn.display_name;
            handleColumn.format = contentColumn.format;
            handleColumn.cumulativeSum = contentColumn.cumulativeSum;
            handleColumn.joins = contentColumn.joins;
            handleColumn.whatif_column = contentColumn.whatif_column || false;
            handleColumn.whatif = contentColumn.whatif || {};
            handleColumn.joins = contentColumn.joins || [];
            if (handleColumn.column_type === 'text' && ![null, 'none'].includes(contentColumn.aggregation_type)) {
              handleColumn.column_type = 'numeric';
              handleColumn.old_column_type = 'text';
            }
  
            ebp.currentQuery.push(_.cloneDeep(handleColumn));
          }

          PanelInteractionUtils.loadColumns(ebp, table, true);
        }
      }

      // for (let i = 0, n = fields.length; i < n; i++) {
      //   const field = fields[i];
      //   try{
      //     if (field) {
      //       ebp.currentQuery[i].format = field.format;
      //       ebp.currentQuery[i].cumulativeSum = field.cumulativeSum;
      //       ebp.currentQuery[i].joins = field.joins;
      //       if (ebp.currentQuery[i].column_type === 'text' && ![null, 'none'].includes(field.aggregation_type)) {
      //         ebp.currentQuery[i].column_type = 'numeric';
      //         ebp.currentQuery[i].old_column_type = 'text';
      //       }
      //     }
      //   }catch(e){
      //     console.error('ERROR handling current query .... handleCurrentQuery.... did you changed the query model?');
      //     console.error(e);

      //   }
      // }
    }
  },

  /**
  * Sets tables and tablesToShow when column is selected
  */
  searchRelations: (ebp: EdaBlankPanelComponent, c: Column, event?: CdkDragDrop<string[]>) => {
    if (ebp.selectedQueryMode !== 'EDA2') {
      // Check to drag & drop only to correct container
      if (!_.isNil(event) && event.container.id === event.previousContainer.id) {
        return;
      }
      // Selected table   
      const originTable = ebp.tables.filter(t => t.table_name === c.table_id)[0];
      // Map with all related tables
      const tablesMap = TableUtils.findRelationsRecursive(ebp.inject.dataSource.model.tables, originTable, new Map());
      ebp.tablesToShow = Array.from(tablesMap.values());
      ebp.tablesToShow = ebp.tablesToShow
        .filter(table => table.visible === true)
        .sort((a, b) => (a.display_name.default > b.display_name.default) ? 1 : ((b.display_name.default > a.display_name.default) ? -1 : 0));
    }
  },

  /**
    * set aggregation types
    * @param column 
    */
  handleAggregationType: (ebp: EdaBlankPanelComponent, column: Column): void => {
    const voidPanel = ebp.panel.content === undefined;
    const tmpAggTypes = [];
    const tableId = column.table_id;
    const colName = column.column_name;
    const displayName = column.display_name.default
    const initializeAgregations = (column, tmpAggTypes) => {
      column.aggregation_type.forEach((agg) => {
        tmpAggTypes.push({ display_name: agg.display_name, value: agg.value, selected: agg.value === 'sum' });
      });
    }
    if (!voidPanel) {
      const colInCurrentQuery = ebp.currentQuery.find(c => c.table_id === tableId && c.column_name === colName  && c.display_name.default === displayName ).aggregation_type.find(agg => agg.selected === true);
      const queryFromServer = ebp.panel.content.query.query.fields;
      // Column is in currentQuery
      if (colInCurrentQuery) {
        column.aggregation_type.forEach(agg => tmpAggTypes.push(agg));
        ebp.aggregationsTypes = tmpAggTypes;
        //Column isn't in currentQuery
      } else {
        const columnInServer = queryFromServer.filter(c =>  c.table_id === tableId && c.column_name === colName   && c.display_name == displayName )[0];
        // Column is in server's query
        if (columnInServer) {
          const aggregation = columnInServer.aggregation_type;
          column.aggregation_type.forEach(agg => {
            tmpAggTypes.push(agg.value === aggregation ? { display_name: agg.display_name, value: agg.value, selected: true }
              : { display_name: agg.display_name, value: agg.value, selected: false });
          });
          //Column is not in server's query
        } else initializeAgregations(column, tmpAggTypes);
        ebp.aggregationsTypes = tmpAggTypes;
      }
      // New panel
    } else {
      initializeAgregations(column, tmpAggTypes);
      ebp.aggregationsTypes = tmpAggTypes;
    }
    ebp.currentQuery.find(c => {
      return   c.table_id === tableId && colName === c.column_name   && c.display_name.default == displayName
    }).aggregation_type = _.cloneDeep(ebp.aggregationsTypes);
  },

  
  /**
    * set aggregation types
    * @param column 
    */
  handleAggregationType4DuplicatedColumns: (ebp: EdaBlankPanelComponent, column: Column): void => {
    const tableId = column.table_id;
    const colName = column.column_name;
    const displayName = column.display_name.default
    const queryFromServer = ebp.panel.content.query.query.fields;
    const columnInServer = queryFromServer.filter(c =>  c.table_id === tableId && c.column_name === colName   && c.display_name == displayName )[0];
    // Column is in server's query
    if (columnInServer) {
        const aggregation = columnInServer.aggregation_type;
        column.aggregation_type.forEach(e => {
          if(e.value===aggregation){
              e.selected = true;
          }else{
            e.selected = false;
          }
        });
      }
  
  },


  /**
  * Set order types
  * @param column 
  */
  handleOrdTypes: (ebp: EdaBlankPanelComponent, column: Column): void => {

    let addOrd: Column;
    const voidPanel = ebp.panel.content === undefined;
    if (!voidPanel) {
      const queryFromServer = ebp.panel.content.query.query.fields;

      if (!column.ordenation_type) {
        if( column.column_type  === 'numeric'){
          column.ordenation_type = 'Desc';
        }else if( column.column_type  === 'date'){
          column.ordenation_type = 'Asc';
        }else{
          column.ordenation_type = 'No';
        }
        
      }

      const colInServer = queryFromServer.filter(c => c.column_name === column.column_name && c.table_id === column.table_id)[0];
      let ordenation = colInServer ? colInServer.ordenation_type : column.ordenation_type;
      const d = ebp.ordenationTypes.find(ag => ag.selected === true && ordenation !== ag.value);
      const ord = ebp.ordenationTypes.find(o => o.value === ordenation);

      if (!_.isNil(d)) {
        d.selected = false;
      }
      if (!_.isNil(ord)) {
        ord.selected = true;
      }

    } else if (!column.ordenation_type) {
      if( column.column_type  === 'numeric'){
        ebp.ordenationTypes = [
          { display_name: 'ASC', value: 'Asc', selected: false },
          { display_name: 'DESC', value: 'Desc', selected: true },
          { display_name: 'NO', value: 'No', selected:false  }
        ];
      }else if( column.column_type  === 'date'){
          ebp.ordenationTypes = [
            { display_name: 'ASC', value: 'Asc', selected: true },
            { display_name: 'DESC', value: 'Desc', selected: false },
            { display_name: 'NO', value: 'No', selected:false  }
          ];
        } else{
        ebp.ordenationTypes = [
          { display_name: 'ASC', value: 'Asc', selected: false },
          { display_name: 'DESC', value: 'Desc', selected: false },
          { display_name: 'NO', value: 'No', selected:true  }
        ];
      }


    } else {
      ebp.ordenationTypes.forEach(ord => {
        ord.value !== column.ordenation_type ? ord.selected = false : ord.selected = true;
      });
    }

    const colIncurrentQuery = ebp.currentQuery.find(c => column.column_name === c.column_name && column.table_id === c.table_id);
    try {
      colIncurrentQuery.ordenation_type = ebp.ordenationTypes.filter(ord => ord.selected === true)[0].value;
    } catch (e) {
      colIncurrentQuery.ordenation_type = 'No';
    }
  },

  /**
   * moves given column to [select or filters] in config panel
   * @param c column to move
   */
  moveItem: (ebp: EdaBlankPanelComponent, c: Column) => {
    // console.log('currentQuery ->',JSON.parse(JSON.stringify(ebp.currentQuery)))
    ebp.disableBtnSave();

    // Busca index en l'array de columnes
    // const match = _.findIndex(ebp.columns, { column_name: c.column_name, table_id: c.table_id,  });
    const match = ebp.columns.find((x: Column) => c.table_id === x.table_id && c.column_name === x.column_name);
    const matchCurrentQuery = ebp.currentQuery.find((x: Column) => c.table_id === x.table_id && c.column_name === x.column_name);
    if (match) match.isdeleted = true; // Marco la columna com a borrada


    if (!ebp.rootTreeTable) {
      ebp.rootTreeTable = ebp.tables.find((table) => table.table_name == c.table_id);
    }

    if (c.table_id !== ebp.rootTreeTable?.table_name) {
      c.joins = (c.joins||[]).length == 0 ? ebp.nodeJoins.pop() : c.joins;
    }

    // Col·loca la nova columna a l'array Select
    if (!matchCurrentQuery) ebp.currentQuery.push(_.cloneDeep(c));

    // Busca les relacions de la nova columna afegida a la consulta
    PanelInteractionUtils.searchRelations(ebp, c);
    // Comprovacio d'agregacions de la nova columna afegida a la consulta
    PanelInteractionUtils.handleAggregationType(ebp, c);
    // Comprovacio ordenacio  de la nova columna afegida a la consulta
    PanelInteractionUtils.handleOrdTypes(ebp, c);
    // resetea las columnas a mostrar
    ebp.inputs.findColumn.reset();

    // Torna a carregar les columnes de la taula
    let table = ebp.tablesToShow.filter(table => table.table_name === ebp.userSelectedTable)[0];
    if (!table) table = ebp.tablesToShow.filter(table => table.table_name === ebp.userSelectedTable.split('.')[0])[0];
    PanelInteractionUtils.loadColumns(ebp, table);
  },

  /**
   * sets chart state (allowed, not allowed)
   * @param charts not allowedCharts
   */
  notAllowedCharts: (ebp: EdaBlankPanelComponent, notAllowedCharts: any[]) => {
    for (const notAllowed of notAllowedCharts) {
      for (const chart of ebp.chartTypes) {
        if (notAllowed === chart.subValue) {
          chart.ngIf = true;
        }
      }
    }
  },

  /**
  * sets chart state (allowed, not allowed) because there are too many data 
  * @param charts not allowedCharts
  */
  tooManyDataForCharts(ebp: EdaBlankPanelComponent, tooManyDataForCharts: any[]) {
    for (const myElem of tooManyDataForCharts) {
      for (const chart of ebp.chartTypes) {
        if (myElem === chart.value) {
          chart.tooManyData = true;
        }
      }
    }
  },

  /**
    * Check data and set notAllowed charts
    */
  verifyData: (ebp: EdaBlankPanelComponent) => {
    // Reset charts
    for (const chart of ebp.chartTypes) {
      chart.ngIf = false;
      chart.tooManyData = false;
    }
    if (!_.isEmpty(ebp.currentQuery)) {
      let notAllowedCharts = [];
      let tooManyDataForCharts = [];
      const dataDescription = ebp.chartUtils.describeData(ebp.currentQuery, ebp.chartLabels);

      if (dataDescription.totalColumns === 0 || _.isEmpty(ebp.chartData)) {
        //this.alertService.addWarning($localize`:@@NoRecords:No se pudo obtener ningún registro`);
      } else {
        notAllowedCharts = ebp.chartUtils.getNotAllowedCharts(dataDescription, ebp.currentQuery);
        tooManyDataForCharts = ebp.chartUtils.getTooManyDataForCharts(ebp.chartData.length);

      }

      /// if the chart is not allowed, it doesn't matters there is too many data.
      tooManyDataForCharts = tooManyDataForCharts.filter(x => !notAllowedCharts.includes(x));

      PanelInteractionUtils.notAllowedCharts(ebp, notAllowedCharts);
      PanelInteractionUtils.tooManyDataForCharts(ebp, tooManyDataForCharts);

    }
  },






  /**
    * Removes given column from content
    * @param c column to remove
    * @param list where collumn is present (select, filters)
    */
  removeColumn: (ebp: EdaBlankPanelComponent, c: Column, list?: string) => {
    ebp.disableBtnSave();

    // Busca de l'array index, la columna a borrar i ho fa
    if (list === 'select') {
      if (ebp.selectedQueryMode == 'EDA2') {
        if (ebp.rootTreeTable && ebp.rootTreeTable.column_name == c.column_name && ebp.rootTreeTable.table_name == c.table_id) {
          ebp.selectedQueryMode = 'EDA';
          ebp.currentQuery.forEach((query) => query.table_id = query.table_id.split('.')[0]);
          ebp.reloadTablesData();
        }
      }

      const match = _.findIndex(ebp.currentQuery, (o) => o.column_name == c.column_name && o.table_id == c.table_id && o.display_name == c.display_name );
      // Reseting all configs of column removed
      ebp.currentQuery[match].ordenation_type = 'No';
      ebp.currentQuery[match].aggregation_type.forEach(ag => ag.selected = false);
      ebp.currentQuery[match].format = '';
      ebp.currentQuery.splice(match, 1);
    } else if (list === 'filter') {
      const match = _.findIndex(ebp.filtredColumns, { column_name: c.column_name, table_id: c.table_id });
      ebp.filtredColumns.splice(match, 1);
    }
    // Carregar de nou l'array Columns amb la columna borrada
    PanelInteractionUtils.loadColumns(ebp, _.find(ebp.tables, (t) => t.table_name === c.table_id));


    // Buscar relacións per tornar a mostrar totes les taules
    if (ebp.currentQuery.length === 0 && ebp.filtredColumns.length === 0) {

      ebp.tablesToShow = ebp.tables;

    } else {
      _.map(ebp.currentQuery, selected => selected.table_id === c.table_id);
    }

    const filters = ebp.selectedFilters.filter(f => f.filter_column === c.column_name);
    filters.forEach(f => ebp.selectedFilters = ebp.selectedFilters.filter(ff => ff.filter_id !== f.filter_id));
  }

}