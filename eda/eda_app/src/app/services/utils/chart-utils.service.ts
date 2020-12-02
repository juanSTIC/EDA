import { LinkedDashboardProps } from '@eda/components/eda-panels/eda-blank-panel/link-dashboards/link-dashboard-props';
import { ChartJsConfig } from '../../module/components/eda-panels/eda-blank-panel/panel-charts/chart-configuration-models/chart-js-config';
import { ChartConfig } from '../../module/components/eda-panels/eda-blank-panel/panel-charts/chart-configuration-models/chart-config';
import { Column } from './../../shared/models/dashboard-models/column.model';
import { Injectable } from '@angular/core';
import { EdaChartComponent } from '@eda/components/eda-chart/eda-chart.component';

export interface EdaChartType {
    label: string;
    value: string;
    subValue: string;
    icon: string;
    ngIf: boolean;
    tooManyData: boolean;
}

export interface FilterType {
    label: string;
    value: string;
    typeof: string[];
}

export interface OrdenationType {
    display_name: string;
    value: string;
    selected: boolean;
}

export interface FormatDates {
    display_name: string;
    value: string;
    selected: boolean;
}

@Injectable()
export class ChartUtilsService {

    public chartTypes: EdaChartType[] = [
        { label: $localize`:@@chartTypes1:Tabla de Datos`, value: 'table', subValue: 'table', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: true },
        { label: $localize`:@@chartTypes2:Tabla Cruzada`, value: 'crosstable', subValue: 'crosstable', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: true },
        { label: 'KPI', value: 'kpi', subValue: 'kpi', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: true },
        { label: $localize`:@@chartTypes3:Gráfico de Pastel`, value: 'doughnut', subValue: 'doughnut', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: true },
        { label: $localize`:@@chartTypes4:Gráfico de Área Polar`, value: 'polarArea', subValue: 'polarArea', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: true },
        { label: $localize`:@@chartTypes5:Gráfico de Barras`, value: 'bar', subValue: 'bar', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: true },
        { label: $localize`:@@chartTypes6:Gráfico de Barras Apiladas`, value: 'bar', subValue: 'stackedbar', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: true },
        { label: $localize`:@@chartTypes7:Gráfico de Barras Horizontales`, value: 'horizontalBar', subValue: 'horizontalBar', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: true },
        { label: $localize`:@@chartTypes8:Gráfico de Lineas`, value: 'line', subValue: 'line', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: true },
        { label: $localize`:@@chartTypes9:Mixto: Barras y lineas`, value: 'bar', subValue: 'barline', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: true },
        { label: $localize`:@@chartTypes10:Mapa de coordenadas`, value: 'coordinatesMap', subValue: 'coordinatesMap', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: false },
        { label: $localize`:@@chartTypes11:Mapa de Capas`, value: 'geoJsonMap', subValue: 'geoJsonMap', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: false },
        { label: $localize`:@@chartTypes12:parallelSets`, value: 'parallelSets', subValue: 'parallelSets', icon: 'pi pi-exclamation-triangle', ngIf: true, tooManyData: false }
    ];

    public filterTypes: FilterType[] = [
        { label: $localize`:@@filters1:IGUAL A (=)`, value: '=', typeof: ['numeric', 'date', 'text'] },
        { label: $localize`:@@filters2:NO IGUAL A (!=)`, value: '!=', typeof: ['numeric', 'date', 'text'] },
        { label: $localize`:@@filters3:MAYOR A (>)`, value: '>', typeof: ['numeric', 'date'] },
        { label: $localize`:@@filters4:MENOR A (<)`, value: '<', typeof: ['numeric', 'date'] },
        { label: $localize`:@@filters5:MAYOR o IGUAL A (>=)`, value: '>=', typeof: ['numeric', 'date'] },
        { label: $localize`:@@filters6:MENOR o IGUAL A (<=)`, value: '<=', typeof: ['numeric', 'date'] },
        { label: $localize`:@@filters7:ENTRE (between)`, value: 'between', typeof: ['numeric', 'date'] },
        { label: $localize`:@@filters8:DENTRO DE (in)`, value: 'in', typeof: ['numeric', 'date', 'text'] },
        { label: $localize`:@@filters9:FUERA DE (not in)`, value: 'not_in', typeof: ['numeric', 'date', 'text'] },
        { label: $localize`:@@filters10:PARECIDO A (like)`, value: 'like', typeof: ['text'] },
        { label: $localize`:@@filters11:VALORES NO NULOS (not null)`, value: 'not_null', typeof: ['numeric', 'date', 'text'] }
    ];

    public ordenationTypes: OrdenationType[] = [
        { display_name: 'ASC', value: 'Asc', selected: false },
        { display_name: 'DESC', value: 'Desc', selected: false },
        { display_name: 'NO', value: 'No', selected: false }
    ];

    public formatDates: FormatDates[] = [
        { display_name: $localize`:@@dates1:AÑO`, value: 'year', selected: false },
        { display_name: $localize`:@@dates2:MES`, value: 'month', selected: false },
        { display_name: $localize`:@@dates3:DIA`, value: 'day', selected: false },
        { display_name: $localize`:@@dates4:NO`, value: 'No', selected: false }
    ];

    public transformDataQuery(type: string, values: any[], dataTypes: string[], dataDescription: any, isBarline: boolean) {
        const output = [];
        const idx = { label: null, serie: null, numeric: [] };

        dataTypes.forEach((e: any, i) => {
            e === 'numeric' ? idx.numeric.push(i) : idx.label != null ? idx.serie = i : idx.label = i;
        });
        const label_idx = idx.label;
        const serie_idx = idx.serie;
        const number_idx = idx.numeric[0];
        if (type === 'doughnut' || type === 'polarArea') {
            const _labels = values.map(v => v[label_idx]);
            const _values = values.map(v => v[number_idx]).filter(elem => elem != null);
            // Faig push a l'array output, que sera retornat per l'inicialització del PieChart
            output.push(_labels, _values);
            return output;

        } else if (['bar', 'line', 'horizontalBar', 'barline'].includes(type)) {
            const l = Array.from(new Set(values.map(v => v[label_idx])));
            const s = serie_idx !== -1 ? Array.from(new Set(values.map(v => v[serie_idx]))) : null;
            const _output = [[], []];
            _output[0] = l;

            //If one serie
            if (dataDescription.otherColumns.length === 1 && dataDescription.numericColumns.length === 1) {
                _output[1] = [{
                    data: values.map(v => v[number_idx]),
                    label: dataDescription.otherColumns[0].name
                }];
                //if two series
            } else if (dataDescription.numericColumns.length === 1) {
                let series = [];
                s.forEach((s) => {
                    _output[1].push({ data: [], label: s });
                    let serie = values.filter(v => v[serie_idx] === s);
                    series.push(serie);
                });
                l.forEach((l) => {
                    // let data_point = null;
                    series.forEach((serie, i) => {
                        const t = serie.filter(s => s[label_idx] === l).map(e => e[number_idx])[0];
                        t != null ? _output[1][i].data.push(t) : _output[1][i].data.push(null);
                    });
                });
                //If >1 numeric series
            } else if (!isBarline) {

                dataDescription.numericColumns.forEach((col, i) => {
                    _output[1].push(
                        {
                            data: values.map(v => v[col.index]),
                            label: col.name
                        });
                });
                // >1 numeric series and is mixed bar-line
            } else {

                dataDescription.numericColumns.forEach((col, i) => {
                    let isLine = i === dataDescription.numericColumns.length - 1;
                    _output[1].push(
                        {
                            data: values.map(v => v[col.index]),
                            label: col.name,
                            type: isLine ? 'line' : 'bar',
                            borderWidth: 1,
                            fill: false,
                            order: isLine ? 0 : i + 1,
                            pointRadius: 2,
                            pointHitRadius: 4,
                            pointHoverRadius: 3,
                            pointHoverBorderWidth: 2
                        });
                });

            }
            return _output;
        }
    }

    public uniqueLabels(labels: Array<string>) {
        const uniqueLabels = [];
        for (let i = 0; i < labels.length; i++) {
            if (uniqueLabels.includes(labels[i])) {
                uniqueLabels.push(`${labels[i]}_${i}`);
            } else {
                uniqueLabels.push(labels[i])
            }
        }
        return uniqueLabels;
    }

    public transformDataQueryForTable(labels: any[], values: any[]) {
        const output = [];
        // Load the Table for a preview
        for (let i = 0; i < values.length; i += 1) {
            const obj = {};
            for (let e = 0; e < values[i].length; e += 1) {
                obj[labels[e]] = values[i][e];
            }
            output.push(obj);
        }

        return output;
    }

    /**
     * Takes current query and returs not allowedCharts
     * @param currentQuery 
     * @return [] notAllowed chart types
     */
    public getNotAllowedCharts(dataDescription: any): any[] {
        let notAllowed =
            [
                'table', 'crosstable', 'kpi', 'geoJsonMap', 'coordinatesMap',
                'doughnut', 'polarArea', 'line', 'bar',
                'horizontalBar', 'barline', 'stackedbar', 'parallelSets'
            ];
        //table (at least one column)
        if (dataDescription.totalColumns > 0) notAllowed.splice(notAllowed.indexOf('table'), 1);

        // KPI (only one numeric column)
        if (dataDescription.totalColumns === 1 && dataDescription.numericColumns.length === 1) {
            notAllowed.splice(notAllowed.indexOf('kpi'), 1);
        }
        // Pie && Polar (Only one numeric column and one char/date column)
        if (dataDescription.totalColumns === 2 && dataDescription.numericColumns.length === 1) {
            notAllowed.splice(notAllowed.indexOf('doughnut'), 1);
            notAllowed.splice(notAllowed.indexOf('polarArea'), 1);
        }
        // Bar && Line (case 1: multiple numeric series in one text column, case 2: multiple series in one numeric column)
        if (dataDescription.numericColumns.length >= 1 && dataDescription.totalColumns > 1 && dataDescription.otherColumns.length < 2
            || dataDescription.numericColumns.length === 1 && dataDescription.totalColumns > 1 && dataDescription.totalColumns < 4) {
            notAllowed.splice(notAllowed.indexOf('bar'), 1);
            notAllowed.splice(notAllowed.indexOf('horizontalBar'), 1);
            notAllowed.splice(notAllowed.indexOf('line'), 1);
            notAllowed.splice(notAllowed.indexOf('stackedbar'), 1);
        }
        if (dataDescription.numericColumns.length > 1 && dataDescription.otherColumns.length < 2) {
            notAllowed.splice(notAllowed.indexOf('barline'), 1);
            const idx = notAllowed.indexOf('stackedbar');
            if (idx >= 0) {
                notAllowed.splice(notAllowed.indexOf('stackedbar'), 1);
            }

        }
        // Crosstable (At least three columns, one numeric)
        if (dataDescription.totalColumns > 2 && dataDescription.numericColumns.length > 0 &&
            dataDescription.totalColumns - dataDescription.numericColumns.length > 1) {
            notAllowed.splice(notAllowed.indexOf('crosstable'), 1);
        }

        //Coordinates map Map (two coordinates and two aditional fields at max)
        if (dataDescription.coordinateColumns === 2 && dataDescription.totalColumns < 5) {
            notAllowed.splice(notAllowed.indexOf('coordinatesMap'), 1);
        }

        //GeoJson Map 
        if (dataDescription.numericColumns.length === 1
            && dataDescription.query.filter(elem => elem.linkedMap).length > 0
            && dataDescription.totalColumns === 2) {
            notAllowed.splice(notAllowed.indexOf('geoJsonMap'), 1);
        }

        //parallelSets
        if(dataDescription.numericColumns.length === 1 && dataDescription.otherColumns.length > 1){
            notAllowed.splice(notAllowed.indexOf('parallelSets'), 1);
        }
        return notAllowed;
    }


    /**
     * Check the resultset size for every chart and return the ones you can not have because you have too many data
     * @param dataSize  
     * @return [] notAllowed chart types
     */
    public getTooManyDataForCharts(dataSize: number): any[] {
        let notAllowed =
            ['table', 'crosstable', 'kpi', 'doughnut', 'polarArea', 'line', 'bar',
                'horizontalBar', 'barline', 'geoJsonMap', 'coordinateMap'];

        //table (at least one column)
        notAllowed.splice(notAllowed.indexOf('table'), 1);
        // Crosstable (At least three columns, one numeric)
        notAllowed.splice(notAllowed.indexOf('crosstable'), 1);

        notAllowed.splice(notAllowed.indexOf('geoJsonMap'), 1);
        // Crosstable (At least three columns, one numeric)
        notAllowed.splice(notAllowed.indexOf('coordinateMap'), 1);

        // KPI (only one numeric column)
        if (dataSize === 1) {
            notAllowed.splice(notAllowed.indexOf('kpi'), 1);
        }
        // Pie && Polar (Only one numeric column and one char/date column)
        if (dataSize < 50) {
            notAllowed.splice(notAllowed.indexOf('doughnut'), 1);
            notAllowed.splice(notAllowed.indexOf('polarArea'), 1);
        }
        // Bar && Line (case 1: multiple numeric series in one text column, case 2: multiple series in one numeric column)
        if (dataSize < 2500) {
            notAllowed.splice(notAllowed.indexOf('bar'), 1);
            notAllowed.splice(notAllowed.indexOf('horizontalBar'), 1);
        }
        // Bar && Line (case 1: multiple numeric series in one text column, case 2: multiple series in one numeric column)
        if (dataSize < 5000) {
            notAllowed.splice(notAllowed.indexOf('line'), 1);
            notAllowed.splice(notAllowed.indexOf('barline'), 1);
        }


        return notAllowed;
    }

    /**
     * Check if actual config is compatible with actual chart and returns a valid color configuration
     * @param currentChartype 
     * @param layout 
     */
    public recoverChartColors(currentChartype: string, layout: ChartConfig) {
        const config = layout.getConfig();
        if (config && (<ChartJsConfig>config).chartType === currentChartype) {
            return this.mergeColors(layout)
        } else {
            return this.generateColors(currentChartype);
        }
    }

    public generateColors(type: string) {
        switch (type) {
            case 'doughnut': return EdaChartComponent.generatePiecolors();
            case 'polarArea': return EdaChartComponent.generatePiecolors();
            case 'bar': return EdaChartComponent.generateChartColors();
            case 'line': return EdaChartComponent.generateChartColors();
            case 'horizontalBar': return EdaChartComponent.generateChartColors();
        }
    }

    public mergeColors(layout: ChartConfig) {

        const config = layout.getConfig();

        if ((<ChartJsConfig>config).colors === null) {
            return this.generateColors((<ChartJsConfig>config).chartType);
        }
        if ((<ChartJsConfig>config).chartType === 'doughnut' || (<ChartJsConfig>config).chartType === 'polarArea') {
            let edaColors = EdaChartComponent.generatePiecolors();
            (<ChartJsConfig>config).colors[0]['backgroundColor'].forEach((element, i) => {
                edaColors[0].backgroundColor[i] = element;
            });
            (<ChartJsConfig>config).colors[0]['backgroundColor'] = edaColors[0].backgroundColor;

        }
        return (<ChartJsConfig>config).colors;
    }

    public describeData(currentQuery: any, labels: any) {

        let names = this.pretifyLabels(currentQuery, labels);
        let out = { numericColumns: [], coordinateColumns: 0, otherColumns: [], totalColumns: 0, query: currentQuery }

        currentQuery.forEach((col, i) => {
            if (col.column_type === 'numeric') {
                out.numericColumns.push({ name: names[i], index: i });
            } else if (col.column_type === 'coordinate' && [0, 1].includes(i)) {
                out.coordinateColumns += 1;
            } else {
                out.otherColumns.push({ name: names[i], index: i });
            }
            out.totalColumns += 1;
        });
        return out;
    }

    public pretifyLabels(columns: Array<Column>, labels: Array<string>) {
        let names = [];
        labels.forEach(label => {
            columns.forEach(column => {
                if (column.column_name === label) {
                    names.push(column.display_name.default);
                }
            });
        });

        return names
    }

    public initChartOptions(type: string, numericColumn: string,
        labelColum: any[], manySeries: boolean, stacked: boolean, size: any, linkedDashboard:LinkedDashboardProps): { chartOptions: any, chartPlugins: any } {

        const t = $localize`:@@linkedTo:Vinculado con`;
        const linked = linkedDashboard ?  `${labelColum[0].name} ${t} ${linkedDashboard.dashboardName}` : '';

        const options = {
            chartOptions: {},
            chartPlugins: {}
        };
        const edaFontSize = manySeries ? 10 : 12;
        const edafontStyle = 'normal';
        const edaPieLegend = {
            display: true,
            fontSize: edaFontSize,
            fontStyle: edafontStyle,
            position: 'bottom',
            labels: {
                fontSize: edaFontSize,
                boxWidth: manySeries ? 8 : 10,
                padding: manySeries ? 4 : 8
            }
        };
        const edaBarLineLegend = {
            display: true,
            fontSize: edaFontSize,
            fontStyle: edafontStyle,
            position: 'bottom',
            labels: {
                fontSize: edaFontSize,
                boxWidth: manySeries ? 8 : 10,
                padding: manySeries ? 4 : 8,
                filter: function (legendItem, data) {
                    return legendItem.datasetIndex < 20
                }
            }
        };

        const maxTicksLimit = size.width < 200 ? 5 : size.width < 400 ? 15 : 40;
        const maxTicksLimitHorizontal = size.height < 200 ? 5 : size.height < 400 ? 15 : 40;

        switch (type) {
            case 'doughnut':
            case 'polarArea':
                options.chartOptions = {
                    animation: {
                        duration: 2000,
                        animateScale: true
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    devicePixelRatio: 2,
                    legend: edaPieLegend,
                    tooltips: {
                        mode: 'label',
                        callbacks: {
                            title: (tooltipItem, data) => {
                                return `${labelColum[0].name}`
                            },
                            label: (tooltipItem, data) => {
                                if (data && tooltipItem) {
                                    const realData = data.datasets[0].data;
                                    const total = realData.reduce((a, b) => {
                                        return a + b;
                                    }, 0);
                                    const elem = data.datasets[0].data[tooltipItem.index];
                                    const percentage = elem / total * 100;
                                    return ` ${data.labels[tooltipItem.index]}, ${numericColumn} : ${parseFloat(elem).toLocaleString('de-DE')} (${percentage.toFixed(2)}%)`;
                                }

                            },
                            footer : () => { return linked },
                            afterLabel: (t, d) => { }
                        }
                    },

                };
                break;
            case 'bar':
                options.chartOptions = {
                    animation: {
                        duration: 2000
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    devicePixelRatio: 2,
                    legend: edaBarLineLegend,
                    tooltips: {
                        callbacks: {
                            title: (tooltipItem, data) => {
                                if (data && tooltipItem)
                                    return ` ${labelColum[0].name} : ${data.labels[tooltipItem[0].index]}`;
                            },
                            label: (tooltipItem, data) => {
                                if (data && tooltipItem)
                                    return `${data.datasets[tooltipItem.datasetIndex].label},  ${numericColumn} : ${parseFloat(tooltipItem.yLabel).toLocaleString('de-DE')} `;
                            },
                            afterLabel: (t, d) => {
                            },
                            footer : () => { return linked },
                        }
                    },
                    scales: {
                        xAxes: [{
                            stacked: stacked || false,
                            gridLines: { display: false },
                            ticks: {
                                callback: (value) => {
                                    if (value)
                                        return value.length > 30 ? (value.substr(0, 17) + '...') : value;
                                },
                                fontSize: edaFontSize, fontStyle: edafontStyle,
                                maxTicksLimit: maxTicksLimit,
                                autoSkip: true,
                            }
                        }],
                        yAxes: [{
                            stacked: stacked || false,
                            gridLines: {
                                drawBorder: false,
                            },
                            display: true,
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 5,
                                beginAtZero: true,
                                callback: (value) => {
                                    if (value)
                                        return isNaN(value) ? value : parseFloat(value).toLocaleString('de-DE');
                                },
                                fontSize: edaFontSize
                            }
                        }]
                    },
                    plugins: {
                        datalabels: { anchor: 'end', align: 'end' }
                    },
                };
                break;
            case 'horizontalBar':
                options.chartOptions = {
                    animation: {
                        duration: 2000
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    devicePixelRatio: 2,
                    legend: edaBarLineLegend,
                    tooltips: {
                        mode: 'nearest',
                        callbacks: {
                            title: (tooltipItem, data) => {
                                if (data && tooltipItem)
                                    return ` ${labelColum[0].name} : ${data.labels[tooltipItem[0].index]}`;
                            },
                            label: (tooltipItem, data) => {
                                if (data && tooltipItem)
                                    return `${data.datasets[tooltipItem.datasetIndex].label},  ${numericColumn} : ${parseFloat(tooltipItem.xLabel).toLocaleString('de-DE')} `;
                            },
                            footer : () => { return linked },
                        }

                    },
                    scales: {
                        xAxes: [{
                            gridLines: {
                                drawBorder: false,
                                display: true
                            },

                            ticks: {
                                callback: (value) => {
                                    if (value)
                                        return isNaN(value) ? value : parseFloat(value).toLocaleString('de-DE');
                                },
                                autoSkip: true,
                                maxTicksLimit: 4,
                                fontSize: edaFontSize,
                                fontStyle: edafontStyle,
                                beginAtZero: true
                            }
                        }],
                        yAxes: [{
                            gridLines: { display: false },
                            ticks: {
                                callback: (value) => {
                                    if (value)
                                        return value.length > 30 ? (value.substr(0, 17) + '...') : value;
                                },

                                fontSize: edaFontSize,
                                beginAtZero: true,
                                maxTicksLimit: maxTicksLimitHorizontal,
                                autoSkip: true
                            }
                        }]
                    },
                    plugins: {
                        datalabels: { anchor: 'end', align: 'end' }
                    },
                };
                break;
            case 'line':
                options.chartOptions = {
                    animation: {
                        duration: 2000
                    },
                    showLines: true,
                    spanGaps: true,
                    responsive: true,
                    maintainAspectRatio: false,
                    legend: edaBarLineLegend,
                    tooltips: {
                        mode: 'nearest',
                        intersect: false,
                        callbacks: {
                            title: (tooltipItem, data) => {
                                if (data && tooltipItem) {
                                    return ` ${labelColum[0].name} : ${data.labels[tooltipItem[0].index]}`;
                                }
                            },
                            label: (tooltipItem, data) => {
                                if (data && tooltipItem)
                                    return ` ${data.datasets[tooltipItem.datasetIndex].label},  ${numericColumn} : ${parseFloat(tooltipItem.yLabel).toLocaleString('de-DE')}  `;
                            },
                            footer : () => { return linked },
                        }
                    },
                    scales: {
                        xAxes: [{
                            gridLines: { drawOnChartArea: false },
                            ticks: {
                                callback: (value) => {
                                    if (value)
                                        return value.length > 30 ? (value.substr(0, 17) + '...') : value;
                                },
                                autoSkip: true,
                                maxTicksLimit: maxTicksLimit,
                                fontSize: edaFontSize,
                                fontStyle: edafontStyle,
                                beginAtZero: true
                            }
                        }],
                        yAxes: [
                            {
                                gridLines: { drawBorder: false, display: true },

                                id: 'y-axis-0', position: 'left',
                                ticks: {
                                    callback: (value) => {
                                        if (value)
                                            return isNaN(value) ? value : parseFloat(value).toLocaleString('de-DE');
                                    },
                                    autoSkip: true,
                                    maxTicksLimit: 6,
                                    fontSize: edaFontSize,
                                    fontStyle: edafontStyle,
                                    beginAtZero: true
                                },
                                stacked: false
                            }
                        ]
                    },
                    elements: {
                        point: { radius: 2, hitRadius: 4, hoverRadius: 3, hoverBorderWidth: 1, pointStyle: 'circle' },
                        line: { borderWidth: 1.5, fill: false, tension: 0.3 }
                    }
                };
                break;
        }

        return options;
    }

}
