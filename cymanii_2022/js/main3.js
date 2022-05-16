var units = "MBTU/D";

// set the dimensions and margins of the graph
var margin = {top: 10, right: 10, bottom: 50, left: 10},
    width = 1000 - margin.left - margin.right,
    height = 340 - margin.top - margin.bottom;

// format variables
var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + " " + units; },
    color = d3.scaleOrdinal(d3.schemeCategory10);

let optimum = {t1:120,t2:113,T1:264,T2:188}


let linkColors = d3.scaleOrdinal()
    .domain(["fuel", "steam",  "electricity", "thermal", "loss"])
    .range(['#8047ab', '#809641','#03adf7','#D81B60','#000']);

// let nodeColors = {"Onsite Steam Generation" : '#1976D2',
//     "Electricity": '#03adf7',
//     "Fuel" : '#8047ab',
//     "Steam" : '#809641',
//     " Steam" : '#809641',
//     "Loss Energy" : '#000'
//
// }

let types = ["fuel", "steam", "electricity", "thermal", "loss"]

function draw_sankey(){

    var header = d3.select("div#sankey").append("rect")
        .attr("width", width + margin.left + margin.right)
        .attr("height", 20 + margin.top + margin.bottom)
        //.append("rect")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")
        .attr("fill", "black");

    d3.select('div#sankey svg').remove();

// append the svg object to the body of the page
    var svg = d3.select("div#sankey").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

// Set the sankey diagram properties
    var sankey = d3.sankey()
        // .nodeWidth(46)
        .nodeWidth(12)
        .nodePadding(40)
        .size([width, height]);

    var path = sankey.link();

    d3.csv("./data/test_file.csv", function(error, data) {

        data = update_data(data)

        //set up graph in same style as original example but empty
        graph = {"nodes" : [], "links" : []};

        data.forEach(function (d) {
            graph.nodes.push({ "name": d.source });
            graph.nodes.push({ "name": d.target });
            graph.links.push({ "source": d.source,
                "target": d.target,
                "value": +d.value,
                "type": d.type});

        });

        // return only the distinct / unique nodes
        graph.nodes = d3.keys(d3.nest()
            .key(function (d) { return d.name; })
            .object(graph.nodes));

        // loop through each link replacing the text with its index from node
        graph.links.forEach(function (d, i) {
            graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
            graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
        });

        // now loop through each nodes to make nodes an array of objects
        // rather than an array of strings
        graph.nodes.forEach(function (d, i) {
            graph.nodes[i] = { "name": d };
        });

        sankey
            .nodes(graph.nodes)
            .links(graph.links)
            .layout(32);

        // add in the links
        var link = svg.append("g").selectAll(".link")
            .data(graph.links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", path)
            .style("stroke-width", function(d) { return Math.max(1, d.dy); })
            .style("stroke", function (d){ return linkColors(d.type)} )
            //.style("stroke", function (d){ return '#000'} )
            .style("fill", "none")
            .style("stroke-opacity", .2)
            .on("mouseover",function() {d3.select(this).style("stroke-opacity", .5)})
            .on("mouseleave",function() {d3.select(this).style("stroke-opacity", .2)})

            .sort(function(a, b) { return b.dy - a.dy; });

        // add the link titles
        link.append("title")
            .text(function(d) {
                return d.source.name + " → " +
                    d.target.name + "\n" + format(d.value); });

        // add in the nodes
        var node = svg.append("g").selectAll(".node")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")"; })
            .call(d3.drag()
                .subject(function(d) {
                    return d;
                })
                .on("start", function() {
                    this.parentNode.appendChild(this);
                })
                .on("drag", dragmove));

        // add the rectangles for the nodes
        node.append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            // .style("fill", function(d) {
            //     return d.color = color(d.name.replace(/ .*/, "")); })
            .style("fill", function(d) { return '#FFFFFF'})
            //     if (Object.keys(nodeColors).includes(d.name)){
            //         return nodeColors[d.name];
            //     }
            //     else{return d.color = color(d.name.replace(/ .*/, "")); }}
            // )
            // return d.color = color(d.name.replace(/ .*/, "")); })
            // .style("fill", function(d) {
            //     colors.filter(obj => {
            //         return obj.name == d.name ? obj.color : null})})
            //return d.color = colors.name == (d.name.replace(/ .*/, "")); })
            .style("stroke", function(d) {
                return d3.rgb(d.color).darker(2); })
            .append("title")
            .text(function(d) {
                return d.name + "\n" + format(d.value); });

        // add in the title for the nodes
        node.append("text")
            .attr("x", -6)
            .attr("y", function(d) { return d.dy / 2; })

            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
            .filter(function(d) { return d.x < width / 2; })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");
//Percentage Text
        // node.append("text")
        //     .attr("x", sankey.nodeWidth()/2)
        //     // .attr("y", function(d) {
        //     //     if(d.dy < 16){
        //     //         return d.dy * 2;
        //     //     }
        //     //     else return d.dy / 2;
        //     // })
        //     .attr("y", function(d) { return d.dy / 2; })
        //     //.attr("dy", ".35em")
        //     .attr("dy", function(d) {
        //         if(d.dy < 16){
        //             return  "-.175em";
        //         }
        //         else return ".35em";
        //     })
        //     .text(function(d) { return parseFloat(d.value/6.5).toFixed(2)*100 + "%"; })
        //     .attr("text-anchor", "middle");
        //
        var legend = svg.append("g").selectAll(".legend")
            .data(types)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d) {
                return "translate(" + types.indexOf(d)*150  + "," + (height+20) + ")"; })

        legend.append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .style("fill", function(d) {return linkColors(d)})
            .style("opacity", .3)

        legend.append("text")
            .text(function (d){return d.charAt(0).toUpperCase() + d.slice(1);})
            .attr("x", 20)
            .attr("y", 10)
            .attr("dy", ".35em")
            .attr("dx", ".35em")
            .attr("text-anchor", "start")
            .style("fill", "black")



        // the function for moving the nodes
        function dragmove(d) {
            d3.select(this)
                .attr("transform",
                    "translate("
                    + d.x + ","
                    + (d.y = Math.max(
                            0, Math.min(height - d.dy, d3.event.y))
                    ) + ")");
            sankey.relayout();
            link.attr("d", path);
        }


    });
}


function delta_display(){
    let delta = d3.select('div#optimization_result')
        .append('p')
        .attr('class', "_result")
        .append('span')
        .text('Delta Temperature Result: ')
        .append("span")
        .attr('id', 'deltaTemp')
        .text('0')
}


function create_slider(num){

    let sliderContainer = d3
        .select('#sliders')
        .append('div')
        .attr('id', 'slider'+num)
        .attr('class', '_slider')


    let sliderValue = d3.select('#slider'+num)
        .append('p')
        .attr('id', "heading"+num)
        .append('span')
        .text(num+': ')
        .append('span')
        .attr("id","value"+num)
        .text(optimum[num]);

    let sliderSimple = d3v6
        .sliderBottom()
        .min(100)
        .max(500)
        .width(300)
        //.tickFormat(d3v6.format('.2%'))
        .ticks(5)
        .default(optimum[num])
        .on('onchange', val => {
            //filter_intersection(val)
            d3.select('#value'+num).text(d3v6.format('.3')(val));
            adjust(calculate_values())
        });

    let gSimple = d3v6
        .select('#slider'+num)
        .append('svg')
        .attr("id", "slider"+num+'svg')
        .attr('width', 400)
        .attr('height', 75)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gSimple.call(sliderSimple);
}


function calculate_values(){
    valt1 = parseFloat(d3.select('#valuet1').text());
    valt2 = parseFloat(d3.select('#valuet2').text());
    valT1 = parseFloat(d3.select('#valueT1').text());
    valT2 = parseFloat(d3.select('#valueT2').text());

    let result = ((valT1 - valt2) - (valT2 - valt1) /( Math.log( (valT1 - valt2) / (valT2 - valt1) )))

    d3.select('#deltaTemp').text(d3v6.format('.3')(result))

    return result

    //adjust(result)

    //console.log(result / 45.8)



    // console.log((valT1 - valt2) - (valT2 - valT1) /( Math.log( (valT1 - valt2) / (valT2 - valt1) )));
}
let dict_perc = {}
let total_dict = {}
let total_dict_2 = {}
init_info()
recalc()
draw_sankey();




create_slider('t1')
create_slider('t2')
create_slider('T1')
create_slider('T2')



delta_display()
calculate_values()
function init_info(){
    dict_perc['Electricity'] = {}
    dict_perc['Electricity']['Process Heating'] = .3
    dict_perc['Electricity']['Machine Drive'] = .4
    dict_perc['Electricity']['Non-process energy'] = .15
    dict_perc['Electricity']['Non-FCC process'] = .15
    dict_perc['Onsite Steam Generation'] = {}
    dict_perc['Onsite Steam Generation']['Thermal-Chemical'] = .8
    dict_perc['Onsite Steam Generation']['Non-FCC process'] = .2
    dict_perc['Fuel'] = {}
    dict_perc['Fuel']['Process Heating'] = 1
    dict_perc['Thermal-Chemical'] = {}
    dict_perc['Thermal-Chemical']['Applied Energy'] = 0.63
    dict_perc['Thermal-Chemical']['Steam'] = 0.30
    dict_perc['Thermal-Chemical']['Loss Energy'] = 0.07
    dict_perc['Process Heating'] = {}
    dict_perc['Process Heating']['Thermal-Chemical'] = 0.8
    dict_perc['Process Heating']['Loss Energy'] = 0.2
    dict_perc['Machine Drive'] = {}
    dict_perc['Machine Drive']['Loss Energy'] = .25
    dict_perc['Machine Drive']['Applied Energy'] = .75
    dict_perc['Non-FCC process'] = {}
    dict_perc['Non-FCC process']['Loss Energy'] = 1
    dict_perc['Non-process energy'] = {}
    dict_perc['Non-process energy']['Loss Energy'] = 1
    total_dict['Electricity'] = 0.06
    total_dict['Fuel'] = 0.774
    total_dict['Onsite Steam Generation'] = 0.166
}

function recalc(){

    Object.keys(dict_perc).forEach(d => total_dict_2[d] = 0)
    Object.keys(total_dict).forEach(d => total_dict_2[d] = total_dict[d])

    Object.keys(dict_perc).forEach(d => {
        Object.keys(dict_perc[d]).forEach(e => {
            if (Object.keys(total_dict_2).includes(e) && Object.keys(total_dict).includes(d)){
                total_dict_2[e] += total_dict[d]*dict_perc[d][e]
            }})
    })
    total_dict_2['Process Heating'] = total_dict['Fuel']*dict_perc['Fuel']['Process Heating'] + total_dict['Electricity']*dict_perc['Electricity']['Process Heating']
    total_dict_2['Thermal-Chemical'] = (total_dict['Onsite Steam Generation']*dict_perc['Onsite Steam Generation']['Thermal-Chemical']) + (total_dict_2['Process Heating']*dict_perc['Process Heating']['Thermal-Chemical'])

    console.log(total_dict_2)

}


function update_data(data){
    data.forEach(d => d.value = total_dict_2[d.source] * dict_perc[d.source][d.target])
    return data
}


function adjust(result){
    total_dict['Fuel'] = .774 / (result / 45.8)
    // dict_perc['Process Heating']['Thermal-Chemical'] = 0.8 * (result / 45.8)
    // dict_perc['Process Heating']['Loss Energy'] = 0.2 * (result / 45.8)
    if (result > 0){
        recalc();
        draw_sankey()
    }

}




