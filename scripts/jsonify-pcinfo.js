/*
Input CSV file should have the following columns:

[0]First Name  [1]Last Name  [2]Email  [3]Affiliation

*/
if (process.argv.length < 4){
	console.log('enter input and output file name.');
	console.log('e.g:  node jsonify-pcinfo.js pcinfo.csv pcinfo.json');
	process.exit(1);
}
const infile = process.argv[2];
const outfile = process.argv[3];

const fs = require('fs');

let pcinfo = fs.readFileSync(infile, 'utf8').split('\n');

pcinfo = pcinfo.map((line)=>(line.split(','))).slice(1);

let jsoninfo = {};
pcinfo.forEach((row)=>{
	jsoninfo[row[2]] = {
		first_name: row[0],
		last_name: row[1],
		affiliation: row[3]
	}
});

fs.writeFileSync(outfile, JSON.stringify(jsoninfo));
console.log('done!');