import React from 'react';
import ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css';

import Dashboard from './components/Dashboard.jsx';

// dynamically load application data
fetch('data/manifest.json')
	.then((res)=>res.json())
	.then((manifest)=>{
		
		// load PC committee data
		let prom1 = fetch('data/'+manifest['committee']).then((res)=>res.json());

		// load sessions data
		let prom2 = Promise.all(manifest['sessions'].map((jsonPath)=>fetch('data/'+jsonPath).then((res)=>res.json())));

		return Promise.all([prom1, prom2])
	})
	.then((info)=>{

		// Data is ready, render application
		ReactDOM.render(
			<Dashboard committee={info[0]} sessions={info[1]}/>,
			document.getElementById("appEntry")
		);

	});