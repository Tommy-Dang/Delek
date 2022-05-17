d3.parallelCoordinate = function () {
    const master = {};
    const runopt = {
        getRange: (data,key)=>d3.extent(data,runopt.getVal(key)),
        getVal: (key)=>((d)=>d[key]),
        updateOutlier:()=>{},
        customAxis:{},
        outlyingCoefficient:1.5,
    };
    const graphicopt = {
        margin: {top: 45, right: 40, bottom: 20, left: 40},
        width: 300,
        height: 300,
        scalezoom: 1,
        zoom: d3.zoom(),
        elHeight: 30,
        widthView: function () {
            return this.width * this.scalezoom
        },
        heightView: function () {
            return this.height * this.scalezoom
        },
        widthG: function () {
            return this.widthView() - this.margin.left - this.margin.right
        },
        heightG: function () {
            return this.heightView() - this.margin.top - this.margin.bottom
        },
        centerX: function () {
            return this.margin.left + this.widthG() / 2;
        },
        centerY: function () {
            return this.margin.top + this.heightG() / 2;
        },
        animationTime: 1000
    };
    let svg, canvas, dimensions,selectedID;
    let dimPositionScale = d3.scaleLinear()
    master.init = function (container) {
        let div = d3.select(container);
        div.selectAll('*').remove();

        div = div.append('div').style('position','relative');
        canvas = div.append('canvas');
        svg = div.append('svg')
            .style('position','absolute')
            .style('top',0)
            .style('left',0);
        svg.append('g').attr('class','mainLayer');
        svg.append('g').attr('class','extraLayer');
        updateSize();
    };

    function updateSize(){
        canvas
            .attr('width',graphicopt.width)
            .attr('height',graphicopt.height)
            .style('width',graphicopt.width+'px')
            .style('height',graphicopt.height+'px');
        svg
            .attr('width',graphicopt.width)
            .attr('height',graphicopt.height);
    }
    master.onBrush = ()=>{}
    master.draw = function () {
        const {data,dimensionKey, getRange, getVal} = runopt;

        dimensions = dimensionKey.map((dim,order)=>{
            let range = getRange(data,dim);
            const customAxis = runopt.customAxis[dim];
            let displayRange,tickFormat;
            if (!runopt.minmax){
                if (customAxis && customAxis.range)
                    range = customAxis.range;
                if (customAxis && customAxis.displayRange)
                    displayRange = customAxis.displayRange;
            }else{
                if (customAxis && customAxis.range && customAxis.displayRange){
                    const customscale = d3.scaleLinear().domain(customAxis.range).range(customAxis.displayRange)
                    displayRange = range.map(r=>customscale(r));
                }
            }
            const scale = d3.scaleLinear().domain(range).range([graphicopt.height-graphicopt.margin.bottom,graphicopt.margin.top]);
            const brush = d3.brushY()
                .extent([[-5,scale.range()[1]], [5,scale.range()[0]]])
                .on("brush end", brushed);
            let axisFunc = d3.axisLeft(scale);
            if (displayRange){
                axisFunc = d3.axisLeft(scale.copy().domain(displayRange));
            }
            if (customAxis&&customAxis.tickFormat)
                axisFunc.tickFormat(customAxis&&customAxis.tickFormat)
            let axis = axisFunc.ticks(5);
            const dimControl = {...(customAxis??{}),range,scale,brush,order,axis,key:dim,el:{}};
            return dimControl;
            function brushed() {
                if (d3.event.selection) {
                    dimControl.active = d3.event.selection.map(scale.invert, scale).sort((a,b)=>a-b);
                }else{
                    delete dimControl.active;
                }
                filterData();
                master.onBrush();
            }
        });

        function getOutlier() {
            const outlierList = outlier(data, dimensionKey, {outlyingCoefficient: runopt.outlyingCoefficient});
            runopt.updateOutlier(outlierList);
            const outlierNum = Object.values(outlierList).filter(d => d === '#f0f').length;
            const undefinedNum = Object.keys(outlierList).length - outlierNum;
            d3.select('#filter_result_para').text(data.length + ' instances, ' + outlierNum + ' outlier' + (outlierNum > 1 ? 's' : ''))
            return outlierList;
        }

        let outlierList = getOutlier();
        // graphicopt.height = graphicopt.margin.top+graphicopt.margin.bottom + graphicopt.elHeight*dimensions.length;
        updateSize();
        //<axis>
        dimPositionScale = d3.scaleLinear().domain([0,dimensions.length-1])
            .range([graphicopt.margin.left,graphicopt.width-graphicopt.margin.right]);

        const holder = svg.select('g.mainLayer');
        const axisg = holder.selectAll('g.axis').data(dimensions);
        axisg.exit().remove();
        axisg.merge(axisg.enter().append('g').attr('class','axis'))
            .attr('transform',d=>`translate(${dimPositionScale(d.order)},0)`)
            .each(function(d){
                d.el.axis = d3.select(this);
                d.el.axis.call(d.axis).selectAll('text')
                    .style('stroke','white')
                    .style('paint-order','stroke')
            });
        holder.selectAll('g.brush').remove();
        const brushg = holder.selectAll('g.brush').data(dimensions);
        brushg.exit().remove();
        brushg.merge(brushg.enter().append('g').attr('class','brush'))
            .attr('transform',d=>`translate(${dimPositionScale(d.order)},0)`)
            .each(function(d){
                d.el.brush = d3.select(this);
                d.el.brush.call(d.brush);
            });
        const labelhg = holder.selectAll('text.label').data(dimensions);
        labelhg.exit().remove();
        labelhg.merge(labelhg.enter().append('text').attr('class','label'))
            .attr('transform',d=>`translate(${dimPositionScale(d.order)},${graphicopt.margin.top}) rotate(15)`)
            .style('text-anchor','end')
            .attr('dy',-5)
            .attr('x',5)
            .attr('fill',d=>d.color??null)
            .text(d=>d.title??d.key)
            .each(function(d){
                d.el.text = d3.select(this);
            });
        // end axis

        // draw line
        function filterData(){
            let _data = data;
            selectedID = undefined;
            let actives = dimensions.filter(d=>d.active);
            if (actives.length){
                console.log(actives)
                _data = data.filter(d=>{
                    let condition = true;
                    actives.find(dim=>{
                        const val = getVal(dim.key)(d);
                        condition = condition && ((val>=dim.active[0])&&(val<=dim.active[1]));
                        return !condition;
                    });
                    return condition;
                })
                selectedID = _data.map(d=>d.id);
            }

            render(_data);
        }
        function render(data){
            const context = canvas.node().getContext("2d");
            context.clearRect(0,0,graphicopt.width,graphicopt.height);
            var line = d3.line()
                .y(function(d,i) { return dimensions[i].scale(d);})
                .x(function(d,i) { return dimPositionScale(i); })
                .curve(d3.curveMonotoneX)
                .defined(d=>(d>=0)||(d!==undefined))
                .context(context);
            const undefinedList = [];
            const filterList = [];
            data.forEach(d=>{
                if (d.outlier){
                    filterList.push(d);
                    return;
                }
                context.beginPath();
                line(dimensions.map(dim=> getVal(dim.key)(d)));
                context.lineWidth = master.colorMap[d.id]?3:1;
                context.strokeStyle = master.colorMap[d.id]??outlierList[d.id]??"rgb(128, 71, 171,0.2)";
                context.stroke();
            });
            filterList.forEach(d=>{
                context.beginPath();
                line(dimensions.map(dim=> getVal(dim.key)(d)));
                context.lineWidth = 1;
                context.strokeStyle = "#f0f";
                context.stroke();
            });
        }
        // end draw line
        master.reRender = ()=>{
            outlierList = getOutlier();
            filterData();
        };
        filterData()
    };
    master.dimensions = ()=>dimensions
    master.dimPositionScale = ()=>dimPositionScale
    master.reRender = ()=>{};
    master.customAxis = (input) => updateVar(input, 'customAxis');
    master.minmax = (input) => updateVar(input, 'minmax');
    master.dimensionKey = (input) => updateVar(input, 'dimensionKey');
    master.data = (input) => updateVar(input, 'data');
    master.updateOutlier = (input) => updateVar(input, 'updateOutlier');
    master.outlyingCoefficient = (input) => updateVar(input, 'outlyingCoefficient');
    master.graphicopt = function (_data) {
        if (arguments.length) {
            d3.keys(_data).forEach(k => graphicopt[k] = _data[k]);
            return master;
        } else
            return graphicopt;
    };
    master.selectedID = ()=>selectedID;
    master.colorMap = {};
    function updateVar(input, variable) {
        if (input!==undefined) {
            runopt[variable] = input;
            return master;
        } else
            return runopt[variable];
    }
    return master
};
// function getScale(d) {
//     let axisrender =  axis.scale(yscale[d]);
//     if(yscale[d].axisCustom) {
//         if (yscale[d].axisCustom.ticks)
//             axisrender = axisrender.ticks(yscale[d].axisCustom.ticks)
//         if (yscale[d].axisCustom.tickFormat)
//             axisrender = axisrender.tickFormat(yscale[d].axisCustom.tickFormat)
//     }else{
//         axisrender = axisrender.ticks(1 + height / 50);
//         axisrender = axisrender.tickFormat(undefined)
//     }
//     return axisrender;
// }
function outlier(data,keys,{outlyingCoefficient}){
    console.time('outline:');
    let dataSpider3 = [];
    const lists = {};
    try {

        data.forEach(d => {
            let condition = true;
            const item = [];
            keys.find(k => {
                if ((d[k] === undefined) || (d[k] < 0)) {
                    condition = false;
                } else {
                    item.push(d[k]);
                }
                return !condition;
            });
            delete d.outlier;
            delete d.undefined;
            if (condition) {
                item.origin = d;
                dataSpider3.push(item);
            } else {
                d.undefined = true;
                lists[d.id] = 'rgba(200,200,200,0.8)'
            }
        });

        let estimateSize = Math.max(1, Math.pow(500, 1 / dataSpider3[0].length));
        console.log('estimateSize:', estimateSize);
        // let maxBins = Math.sqrt(dataSpider3.length);
        // let minBins = Math.min(20,dataSpider3.length/4);
        // if (maxBins<minBins){
        //     maxBins = dataSpider3.length;
        // }
        let minBins = Math.min(100, dataSpider3.length - 1);
        let maxBins = dataSpider3.length;
        let scagOptions = {
            startBinGridSize: estimateSize,
            // minBins,
            // maxBins,
            // outlyingCoefficient: 1.5,
            outlyingCoefficient: outlyingCoefficient ?? 1.5,
            // incrementA:2,
            // incrementB:0,
            // decrementA:1 / 3,
            // decrementB:0,
        };
        // scag = scagnosticsnd(handledata(index), scagOptions);
        let outlyingBins = [];
        outlyingBins.pointObject = {};
        // remove outlying
        let scag = scagnosticsnd(dataSpider3.map((d, i) => {
            var dd = d.slice();
            dd.data = d;
            return dd;
        }), scagOptions);
        debugger
        console.timeEnd('outline:');
        console.log('Outlying bin=' + scag.outlyingBins.length);


        scag.outlyingBins.map((ob, i) => {
            ob.map(o => {
                let d = o.data;
                d.origin.outlier = 1;
                lists[d.origin.id] = '#f0f';
            });
        });
        console.timeEnd('outline:');
    }catch(e){

    }
    return lists;
}
