const http = require('http');
const express = require('express');

const HOST = 'localhost';
const PORT = 3000;

/* Create main express app  */
const app = express();
const server = http.createServer(app);

// Use a bunch of middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Public App */
app.use('/', express.static('src'));
server.listen(PORT, HOST, function(){
	console.log(">>> Starting web server on "+HOST+":"+PORT);
});