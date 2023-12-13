import { Component, ViewChild } from '@angular/core';
import {
    GlobalFiltersService,
    AlertService,
    DashboardService,
    FileUtiles,
    QueryBuilderService
} from '@eda/services/service.index';
import { EdaDialog, EdaDialogCloseEvent, EdaDialogAbstract, EdaDatePickerComponent } from '@eda/shared/components/shared-components.index';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { EdaDatePickerConfig } from '@eda/shared/components/eda-date-picker/datePickerConfig';
import * as _ from 'lodash';
@Component({
    selector: 'dashboard-filter-dialog',
    templateUrl: './dashboard-filter-dialog.component.html',
    styleUrls: ['../dashboard.component.css']
})

export class DashboardFilterDialogComponent extends EdaDialogAbstract {

    
    @ViewChild('myCalendar', { static: false }) datePicker: EdaDatePickerComponent;

    public dialog: EdaDialog;
    public params: any = {};

    public panelsToDisplay: Array<{ title, id, active, avaliable, visible }>;
    public panelstoFilter: Array<{ title, id, active, avaliable, visible }>;

    // Dialog  vars
    public targetCols: any[] = [];
    public targetTables: any[] = [];
    public targetValues: any = [];
    public targetCol: any;
    public targetTable: any;
    public selectedValues: any = [];
    public applyToAll: boolean = true;
    public switchChecked: boolean = false;
    public switchFilter: any;
    public publicRoHidden  = [ //valors del dropdown de filtrat de visiblitat
        {label: $localize`:@@public:público`, value: `public` }, 
        {label: $localize`:@@readOnly:deshabilitado`, value: `readOnly` }, 
        {label: $localize`:@@hidden:oculto`, value: `hidden` }
        ]; 
    public publicRoHiddenOption: any = "public" //valor per defecte del dropdown
    
    public rangeDates: Date[];
    public selectedRange : string = null;
    public selectedFilter: any;
    public datePickerConfigs: any = {};
    
    // Global filters vars
    public filtersList: Array<{ table, column, panelList, data, selectedItems, selectedRange, id, isGlobal, applyToAll, visible }> = [];

    //strings
    public header1 : string = $localize`:@@aplyToAllPanelsH5:¿Aplica a todos los paneles?`;
    public header2 : string = $localize`:@@panelsToAplyH5:Paneles para los que aplica el filtro`;
    public header3 : string = $localize`:@@filterForH5: Filtrar por`;
    public header4 : string = $localize`:@@canIfilter: Visiblidad del filtro`;
    public greendot :string = $localize`:@@greendot:Paneles filtrados`;
    public reddot :string =$localize`:@@reddot:Paneles no relacionados`;
    public unselecteddot :string = $localize`:@@unselecteddot:Paneles no filtrados`;

    constructor(
        private globalFiltersService: GlobalFiltersService,
        private dashboardService: DashboardService,
        private queryBuilderService: QueryBuilderService,
        private fileUtils: FileUtiles,
        private alertService: AlertService) {
        super();

        this.dialog = new EdaDialog({
            draggable: false,
            title: $localize`:@@DashboardFilters:FILTROS DEL INFORME`,
            show: () => this.onShow(),
            hide: () => this.onClose(EdaDialogCloseEvent.NONE),
        });
        this.dialog.style= {width: '70%'};
        
    
    }

    onShow() {
        this.params = this.controller.params;
        
        if (this.params.filtersList) {
            for (let filter of this.params.filtersList) {
                this.filtersList.push(filter);
            }
        }

        this.selectPanelToFilter(this.params.panels.filter(p => p.content)[0]);
        if (this.params.filter) this.onEditFilter(this.params.filter);
    }


    private selectPanelToFilter(panel: any) {
        const newPanel = this.params.panels.find((p: any) => p.id === panel.id);
        const panels = this.globalFiltersService.panelsToDisplay(this.params.dataSource.model.tables, this.params.panels, newPanel);
        const sortByTittle = (a, b) => {
            if (a.title < b.title) { return -1; }
            if (a.title > b.title) { return 1; }
            return 0;
        };
        this.panelsToDisplay = panels.sort(sortByTittle);
        
        if (this.controller.params?.filter?.panelList) {
            const selectedPanelList = this.controller.params?.filter?.panelList;

            for (let displayPanel of this.panelsToDisplay) {
                if (!selectedPanelList.some((id: any) => displayPanel.id === id)) {
                    displayPanel.active = false;
                }
            }
        }
        
        this.panelstoFilter = this.panelsToDisplay.filter(p => p.avaliable === true && p.active === true );

        // Filter can only apply to all panels if all panels are in display list
        this.applyToAll = (this.panelsToDisplay.length === this.panelstoFilter.length);

        if (this.applyToAll) this.switchChecked = true;

        this.setTablesAndColumnsToFilter();
    }

    setTablesAndColumnsToFilter() {
        const tables = [];
        let notVisibleTables = [];
        this.targetTables = [];

        notVisibleTables = this.params.dataSource.model.tables.filter(t => t.visible === false).map(t => t.table_name);
        this.panelstoFilter.forEach(panel => {
            const tmpPanel = this.params.panels.find(p => p.id === panel.id);
            tmpPanel.content.query.query.fields.forEach(field => {
                if (!tables.includes(field.table_id)) {
                    tables.push(field.table_id);
                }
            });
        });

        const fMap = this.globalFiltersService.relatedTables(tables, this.params.dataSource.model.tables);
        fMap.forEach((value: any, key: string) => {
            if (!notVisibleTables.includes(key)) {
                this.targetTables.push({ label: value.display_name.default, value: key });
            }
        });

        this.targetTables = this.targetTables.slice();
        this.targetTables.sort((a, b) => a.value < b.value ? -1 : a.value > b.value ? 1 : 0);
    }

    addPanelToFilter(panel) {
        if (panel.avaliable === false) {
            this.selectPanelToFilter(panel);
        } else if (panel.active === true) {
            panel.active = false;
            this.panelstoFilter = this.panelstoFilter.filter(p => p.id !== panel.id);
        } else {
            panel.active = true;
            this.panelstoFilter.push(panel);
        }
    }

    public getColumnsByTable() {
        this.targetCols = [];
        const table = this.params.dataSource.model.tables.filter(t => t.display_name.default === this.targetTable.label);

        table[0].columns.filter(col => col.visible === true).forEach(col => {
            this.targetCols.push({ label: col.display_name.default, value: col });
        });

        this.targetCols = this.targetCols.slice();
        this.targetCols.sort((a, b) => a.value < b.value ? -1 : a.value > b.value ? 1 : 0);
    }

    public saveGlobalFilter() {
        let response: any;
        if (this.params?.isnew) {
            if (this.panelstoFilter.length === 0 || !this.targetTable || !this.targetCol) {
                return this.alertService.addWarning($localize`:@@mandatoryFields:Recuerde rellenar los campos obligatorios`);
            }
    
            this.filtersList.push({
                id: this.fileUtils.generateUUID(),
                table: this.targetTable,
                column: this.targetCol,
                panelList: this.panelstoFilter.map(p => p.id),
                data: null,
                selectedItems: this.selectedValues,
                selectedRange:this.selectedRange,
                isGlobal: true,
                applyToAll: !this.applyToAll,
                visible: this.publicRoHiddenOption
            });
    
            // this.loadGLobalFiltersData(this.filtersList[this.filtersList.length - 1]);
            response = {
                filterList: this.filtersList[this.filtersList.length - 1],
                targetTable: this.targetTable.value
            };

            this.onClose(EdaDialogCloseEvent.NEW, response);
        } else {
            if (this.selectedFilter) {
                this.selectedFilter.table = this.targetTable;
                this.selectedFilter.column = this.targetCol;
                this.selectedFilter.panelList = this.panelstoFilter.map(p => p.id);
                this.selectedFilter.selectedItems = this.selectedValues;
                this.selectedFilter.selectedRange =this.selectedRange;
                this.selectedFilter.applyToAll = !this.applyToAll;
                this.selectedFilter.visible = this.publicRoHiddenOption;
          //      this.selectedFilter.filterMaker = this;

                for (let filter of this.filtersList) {
                    if (filter.id === this.selectedFilter.id) {
                        Object.assign(filter, this.selectedFilter);
                    }
                }
                this.selectedFilter = null;
            }

            response = { filterList: this.filtersList };
            this.onClose(EdaDialogCloseEvent.UPDATE, response);
        }

    }

    public loadGlobalFiltersData() {
        const params = {
            table: this.targetTable.value,
            dataSource: this.params.dataSource._id,
            dashboard: this.params.id,
            panel: '',
            filters: []
        };
        this.dashboardService.executeQuery(
            this.queryBuilderService.normalQuery([this.targetCol.value], params)
        ).subscribe(
            res => this.targetValues = res[1].filter(item => !!item[0]).map(item => ({ label: item[0], value: item[0] })),
            err => this.alertService.addError(err)
        );
    }

    processPickerEvent(event){
        if (event.dates) {
            const dtf = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: '2-digit' });
            if ( !event.dates[1]) {
                event.dates[1] = event.dates[0];
            }

            let stringRange = [event.dates[0], event.dates[1]]
                .map(date => {
                    let [{ value: mo }, , { value: da }, , { value: ye }] = dtf.formatToParts(date);
                    return `${ye}-${mo}-${da}`
                });

            this.selectedValues = stringRange;
            this.selectedRange = event.range;
        }
    }

    confirmDisabled(){
        if(this.datePicker){
            return this.targetCol && this.targetCol.value.column_type === 'date' && this.datePicker.active;
        }
       else return false;
    }

    applyToAllCheck() {
        this.applyToAll = !this.applyToAll;
        if(this.applyToAll){
            this.panelstoFilter = this.panelsToDisplay.filter(p => p.avaliable === true   );
        }
        return this.applyToAll;
    }

    //afegit el dropdown per fer  el filtre public, nomes lectura o privat
    applyToPublicFilterCheck(publicRoHiddenOption) {   
        if (publicRoHiddenOption) {
            this.publicRoHiddenOption = publicRoHiddenOption;
        } else {
            this.publicRoHiddenOption = "public";
        }
        return this.publicRoHiddenOption;
        
    }

    resetSelectedValues() {
        this.selectedValues = [];
    }

    public removeFilter(filter: any): void {
        filter.isdeleted = true;
        this.selectedValues = [];
        this.filtersList.splice(this.filtersList.indexOf(filter), 0);
    }

    public onReorderFilter(event: CdkDragDrop<string[]>): void {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }

    public onEditFilter(filter: any): void {
        this.targetTable = filter.table;
        this.getColumnsByTable();
        this.targetCol = this.targetCols.find((col) => col.value?.column_name === filter.column.value?.column_name);
        this.loadGlobalFiltersData();
        this.selectedValues = filter.selectedItems;
        this.selectedRange = filter.selectedRange;
        this.selectedFilter = filter;

        if (filter.column.value.column_type === 'date') {
            this.loadDatesFromFilter(filter)
        }
    }

    private loadDatesFromFilter(filter) {
        this.datePickerConfigs[filter.id] = new EdaDatePickerConfig();
        const config = this.datePickerConfigs[filter.id];
        config.dateRange = [];
        config.range = filter.selectedRange;
        config.filter = filter;
        if (filter.selectedItems.length > 0) {
            if (!filter.selectedRange) {
                let firstDate = filter.selectedItems[0];
                let lastDate = filter.selectedItems[filter.selectedItems.length - 1];
                config.dateRange.push(new Date(firstDate.replace(/-/g, '/')));
                config.dateRange.push(new Date(lastDate.replace(/-/g, '/')));
            }
        }
    }

    public closeDialog() {
        this.onClose(EdaDialogCloseEvent.NONE);
    }

    public onClose(event: EdaDialogCloseEvent, response?: any): void {
        return this.controller.close(event, response);
    }

}
