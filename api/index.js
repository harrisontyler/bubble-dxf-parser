var express = require('express');
var bodyParser = require('body-parser');
var formidable = require('formidable');
var helmet = require('helmet');
var fs = require('fs');
var path = require('path');
var cors = require('cors');
var DxfParser = require('dxf-parser');

var ReadRemoteURL = require('./readRemoteURL.js');
var DXFParser = require('./parseDXF.js');
var DXFParserObj = require('./parseDXF-Object.js');

var app = express();
app.use(express.static(path.join(path.resolve('./'), 'public')));
// app.use(express.static('../public'));
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(helmet());


//just a test to fetch file from s3  upload
// app.get('/fetchtest', (req, res) => {
//     const fileURL = "https://s3.amazonaws.com/appforest_uf/f1595892674477x375947631632813440/sample.dxf";
//     const apiURL = "https://bubble-dxf-parser.herokuapp.com/remoteurl";
//     fetch(apiURL, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             url: fileURL,
//         }),
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log(data);
//         res.json(data);
//     });
//     // .catch(error => console.log(error));
// });

//receives remote url as body and parses DXF file and reutrns DXF object with arrays
app.post('/remoteurl', (req, res) => {
    console.log("*********DXF ARRAY CALL*********");
	// console.log(req.body.url);
    const url = req.body.url;
    const unit = req.body.unit;
    ReadRemoteURL.getBodyURL(url).then(function(ret) {
        console.log("Received file, building DXF obj...");

        var parser = new DxfParser();
        try {
            var dxf = parser.parseSync(ret);
            const dxfObj = DXFParser.parseDXF(dxf, unit);

            console.log("Returning DXF Object:", dxfObj);
            console.log("Sending obj...");
            res.json(dxfObj);
        } catch(err) {
            console.log("Error building DXF obj");
            throw new Error(err.message);
        }
    });
});

//receives remote url as body and parses DXF file and returns DXF object with objects
app.post('/remoteurl-v2', (req, res) => {
    console.log("*********DXF OBJECT CALL*********");
    // console.log(req.body.url);
    const url = req.body.url;
    const unit = req.body.unit;
    ReadRemoteURL.getBodyURL(url).then(function(ret) {
        console.log("Received file, building DXF obj...");

        var parser = new DxfParser();
        try {
            var dxf = parser.parseSync(ret);
            const dxfObj = DXFParserObj.parseDXF(dxf, unit);

            console.log("Returning DXF Object:", dxfObj);
            console.log("Sending obj...");
            res.json(dxfObj);
        } catch(err) {
            console.log("Error building DXF obj");
            throw new Error("Error with DXF Parse:", err.message);
        }
    });
});

/*
	POST method for DXF file upload
	Return object data will be in following format:
	{
		layers: {
			ex_layer_1: {
				color: numerical value of color,
				colorIndex: numerical vlue of color index,
				length: sum of all lengths of given layer,
				area: sum of all areas of given layer,
			}
		},
		totLength: sum of all entity lengths,
		image: dxf file as an image,
		extents: [x extent, y extent] 
	}
*/
app.post('/upload', (req, res) => {

	//parse data incoming from form file -> may need to switch to get file
	var form = new formidable.IncomingForm();
    form.parse(req);

    //get file from form upload
    form.on('file', async (name, file) => {
        console.log('Uploaded ' + file.name);

        //receive file text to pass into dxf parser
        var fileText = fs.readFileSync(file.path, { encoding: 'utf8' });
        var parser = new DxfParser();
        try {
            var dxf = parser.parseSync(fileText);

            //parse dxf object
            const dxfObj = DXFParser.parseDXF(dxf);
            console.log(dxfObj);
            res.send(dxfObj);

        } catch(err) {
            console.log(err);
            throw new Error("error parsing DXF File:" + err.message);
        }

    });
});

 
const PORT = process.env.PORT || 5000;
app.listen(PORT, function() {
	console.log(`Listening on ${PORT}`);
});
