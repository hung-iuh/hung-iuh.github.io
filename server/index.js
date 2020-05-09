const express = require('express');
let bodyParser = require('body-parser');
const fs = require('fs');
var app = express();
var config = require('../config.json');

app.use(function(req, res, next){
    req.BASE_URI = config.BASE_URI || "http://sv-call-ajax.herokuapp.com";
    req.VERIFY_CHECKSUM = config.VERIFY_CHECKSUM;
 
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'DEVICE-CODE,BROWSER-CODE,Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    next();
});

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/getData', function (req, res) {

	fs.readFile("./data.json", 'utf8', function(err, data) {
		if(err) {
	        return res.json({ 
	        	success: false,
	        	message: err 
	        });
	    }

	    return res.json({ 
        	success: true,
        	data: data 
        });
	})
});

app.post('/sendData', function (req, res) {
	fs.writeFile("./data.json", JSON.stringify(req.body),function(err) {
	    if(err) {
	        return res.json({ 
	        	success: false,
	        	message: err 
	        });
	    }
	    return res.json({
	        success: true,
	        message:'The data was saved'
    	});
	});
});

app.post('/deleteData', function (req, res) {
	fs.writeFile("./data.json", "",function(err) {
	    if(err) {
	        return res.json({ 
	        	success: false,
	        	message: err 
	        });
	    }
	    return res.json({
	        success: true,
	        message:'The data was deleted'
    	});
	});
});

var port = process.env.PORT || config.PORT || 9000;
app.listen(port, function () {
	console.log('server run on port: ', port);
});