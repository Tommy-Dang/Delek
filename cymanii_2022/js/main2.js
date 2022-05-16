var units = "MBTU/D";

// set the dimensions and margins of the graph
var margin = {top: 10, right: 10, bottom: 50, left: 10},
    width = 1000 - margin.left - margin.right,
    height = 340 - margin.top - margin.bottom;

// format variables
var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + " " + units; },
    color = d3.scaleOrdinal(d3.schemeCategory10);

// function getColor(n){
//     return d3.schemeCategory10[n]
// }
// let linkColors = d3.scaleOrdinal()
//     .domain(["thermal", "steam", "fuel", "electricity", "product", "loss"])
//     .range(['#D81B60','#1976D2','#388E3C','#FBC02D','#E64A19','#000']);

let linkColors = d3.scaleOrdinal()
    .domain(["thermal", "steam", "fuel", "electricity", "loss"])
    .range(['#D81B60','#1976D2','#388E3C','#FBC02D','#000']);

let nodeColors = {"Onsite Steam Generation" : '#1976D2',
    "Electricity": '#FBC02D',
    "Fuel" : '#388E3C',
    "Steam" : '#1976D2',
    " Steam" : '#1976D2',
    "Loss Energy" : '#000'

}

// let types = ["thermal", "steam", "fuel", "electricity", "product", "loss"]
let types = ["thermal", "steam", "fuel", "electricity", "loss"]


// let linkColor2 = {thermal: "#D81B60",
//     steam:'#1976D2', fuel:'#388E3C', electricity:'#FBC02D'}
    // .range(['#D81B60','#1976D2','#388E3C','#FBC02D','#E64A19','#455A64']);
//
// let colors =   [{name:"Steam", color:getColor(0)},
//     {name:"Natural Gas", color:getColor(1)},
//     {name:"Recovered Thermal", color:getColor(1)},
//     {name:"Fuel Gas", color:getColor(1)},
//     {name:"Electricity", color:getColor(1)},
//     {name:"Air Blower", color:getColor(1)},
//     {name:"Heat Exchanger", color:getColor(1)},
//     {name:"Charge Heater", color:getColor(1)},
//     {name:"Pumps", color:getColor(1)},
//     {name:"Regenerator", color:getColor(1)},
//     {name:"Reactor", color:getColor(1)},
//     {name:"CO Burner", color:getColor(1)},
//     {name:"Main Fractionator", color:getColor(1)},
//     {name:"Produced Steam", color:getColor(1)},
//     {name:"Unrecovered Thermal", color:getColor(1)},
//     {name:"Process Consumption", color:getColor(1)},
//     {name:"Recovered Thermal ", color:getColor(1)},
//     {name:"Produced Fuel Gas", color:getColor(1)}
//
// ]

var header = d3.select("body").append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", 20 + margin.top + margin.bottom)
    //.append("rect")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")")
    .attr("fill", "black");

// append the svg object to the body of the page
var svg = d3.select("body").append("svg")
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

// load the data
d3.csv("./data/data_overview.csv", function(error, data) {

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