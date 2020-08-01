const EntityCalculation = require('./EntityCalculation/Utilities.js');
const THREEdxf= require('./DXFImageConversion/three-dxf-node.js');

function parseDXF(dxf, unit) {

    //gather x,y extents
    const xExtent = Math.round((dxf.header.$EXTMAX.x - dxf.header.$EXTMIN.x) * 100) / 100;
    const yExtent = Math.round((dxf.header.$EXTMAX.y - dxf.header.$EXTMIN.y) * 100) / 100;
    if(!unit) unit = "";
    const extents = `${xExtent}${unit} x ${yExtent}${unit}`;

    //returning object
    //layers is now an array holding [layername, color, colorindex, length, area]
    var res = {
        // layers: [],
        layers: {},
        totLength: 0,
        image: THREEdxf.drawDXF(dxf, 400, 400),
        extents: extents,
        errors: [],
    };
    var totLength = 0;

    //fill colors object using layers in table section
    // var layerDictionary = {};
    var i = 0;
    for (const layerNum in dxf.tables.layer.layers) {
        var layer = dxf.tables.layer.layers[layerNum];
        const color = layer.color ? layer.color : null;
        const colorIndex = layer.colorIndex ? layer.colorIndex : null;

        // layerDictionary[layer.name] = i;
        // res.layers.push([layer.name, color, colorIndex, 0, 0]);
        // i++;


        //below code is for objectfying layers in return object
        //bubbleio doesnt handle well so were building array and storing
        //layer indices within layerDictionary

        res.layers[layer.name] = {
            name: layer.name,
            color: color,
            colorIndex: colorIndex,
            length: 0,
            area: 0,
        };
    }


    // Iterate through entities inside dxf.entities and perform calculations accordingly
    for (const entityNum in dxf.entities) {
        var entity = dxf.entities[entityNum];
        var calcs = EntityCalculation.handleEntityCalculation(entity);

        //calcs.message occurs when entity calculation is not supported
        if(!calcs.message) {
            //get index of layer within res' layer array
            // var layerIndex = layerDictionary[entity.layer];
            // var layerArray = res.layers[layerIndex];

            // layerArray[3] += calcs.length;
            // layerArray[4] += calcs.area;

//          //apply total length calculation
            res.totLength += calcs.length;

//          //apply layer specific area and length calculations
            res.layers[entity.layer].length += calcs.length;
            res.layers[entity.layer].area += calcs.area;

        } else {

            //errors array contains entity types that are not supported
            res.errors.push(entity.type);
            console.log(`not possible for entity type: ${entity.type}\n`);
        }
    }

    //return resulting dxf object
    return res;
}

module.exports = { parseDXF }