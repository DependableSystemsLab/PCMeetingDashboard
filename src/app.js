(() => {
window.addEventListener('load', async () => {

	// dynamically load application data first
	fetch('data/manifest.json').then(res => res.json())
	.then(manifest => {
		
		// load PC committee data
		let prom1 = fetch('data/'+manifest['committee']).then(res => res.json());

		// load sessions data
		let prom2 = Promise.all(manifest['sessions'].map(jsonPath => fetch('data/'+jsonPath).then(res => res.json())));

		return Promise.all([prom1, prom2])
	})
	.then(info => {

		// Data is ready, render application
		let app = new Vue({
			el: '#appEntry',
			data: {
				committee: info[0],
				sessions: info[1]
			},
			template: `<dashboard :committee="committee" :sessions="sessions"></dashboard>`
		});

	});
});

// Declare some Vue helpers
Vue.filter('time', ms => {
	if (!ms) return '00:00:00';
	return (ms<0?'-':'')+('00'+(Math.floor(Math.abs(ms)/3600000)%24)).slice(-2)+':'+('00'+(Math.floor(Math.abs(ms)/60000)%3600)).slice(-2)+':'+('00'+(Math.floor(Math.abs(ms)/1000)%60)).slice(-2)
});

Vue.component('countdown', {
	props: [ 'startAt' ],
	data: () => ({
		current: 0,
		paused: true
	}),
	computed: {
		color: function(){
			if (this.paused) return 'grey';
			if (this.current < 0) return 'red';
			return 'hsl(' + Math.round(120 * this.current / this.$props.startAt) + ', 100%, '+(25 + Math.round(25 * (1 - this.current / this.$props.startAt)))+'%)';
		}
	},
	mounted: function(){
		this.timer = null;
		this.current = this.$props.startAt;

		this.resume();
	},
	beforeDestroy: function(){
		clearInterval(this.timer);
	},
	methods: {
		toggle: function(){
			if (this.timer !== null) this.pause();
			else this.resume();
		},
		pause: function(){
			clearInterval(this.timer);
			this.timer = null;
			this.paused = true;
		},
		resume: function(){
			this.timer = setInterval(() => {
				this.current = this.current - 1000;
			}, 1000);
			this.paused = false;
		}
	},
	template: `<div>
      <p class="heading">Time</p>
      <p class="title" @click="toggle()" style="cursor: pointer;" :style="{ 'color': color }">{{ current | time }}</p>
    </div>`
});

Vue.component('dashboard', {
	props: [ 'committee', 'sessions' ],
	data: () => ({
		session: null,
		min_per_paper: 5,
		viewing: null,
		mode: 'NotReady',
		decision: null,
		decisions: {}
	}),
	computed: {
		nextPaper: function(){
			if (!this.viewing) return null;
			return this.sessions[this.session][1 + this.sessions[this.session].indexOf(this.viewing)];
		},
		paperCount: function(){
			return this.sessions.reduce((acc, session) => (acc + session.length), 0);
		},
		rejectedCount: function(){
			return this.sessions.reduce((acc, session) => (acc + session.filter(paper => this.decisions[paper.pid] === 'X').length), 0);
		},
		acceptedCount: function(){
			return this.sessions.reduce((acc, session) => (acc + session.filter(paper => this.decisions[paper.pid] === 'O').length), 0);
		},
		acceptanceRate: function(){
			return (100 * this.acceptedCount / this.paperCount).toFixed(1)
		},
		acceptedPapers: function(){
			return this.sessions.reduce((acc, session) => acc.concat(session.filter(paper => this.decisions[paper.pid] === 'O')), []);
		}
	},
	methods: {
		reset: function(){
			this.session = null;
			this.mode = 'NotReady';
			this.viewing = null;
			this.decision = null;
		},
		selectPaper: function(paper){
			this.viewing = paper;
			this.mode = 'NotReady';
			this.decision = this.decisions[paper.pid];
		},
		updateDecision: function(paper, decision){
			this.decision = decision;
			this.decisions[paper.pid] = decision;
			window.localStorage.setItem('DecisionStore', JSON.stringify(this.decisions));
		},
		downloadResults: function(){
			let csvText = `paper_id,title,accepted\n` + this.sessions.map(session => session.map(paper => `${paper.pid},"${paper.title}",${this.decisions[paper.pid] === 'O' ? 'Y' : ''}`).join('\n')).join('\n');
			
			let blob = new Blob([csvText], { type: 'text/csv;charset=utf-8'});
	  		let url = URL.createObjectURL(blob);

	  		let link = document.createElement('a');
		  	link.href = url;
		  	link.download = 'paper-decisions.csv';
		  	link.click();
		}
	},
	mounted: function(){
		Object.assign(this.decisions, JSON.parse(window.localStorage.getItem('DecisionStore')) || {});
	},
	template: `<div class="container">
		<nav class="navbar is-light" role="navigation" aria-label="main navigation">
			<div class="navbar-brand">
				<div class="navbar-item" @click="reset()">
					<a class="button is-primary">
						<span class="icon">
							<i class="fas fa-home"></i>
						</span>
					</a>
				</div>
			</div>
			<div class="navbar-start">
				<div class="navbar-item">
					<span>Minutes per Paper = </span>
					<input v-model="min_per_paper" class="input is-primary" type="number" style="width: 5em">
				</div>
			</div>
			<div class="navbar-end">
				<div class="navbar-item">
					<span>Maintainer: kumseok@ece.ubc.ca</span>
				</div>
				<div class="navbar-item">
					<img src="/assets/ubc-logo.jpg">
				</div>
			</div>
		</nav>

		<div v-if="session === null" class="has-text-centered">
			
			<div class="columns">
				<div class="column"></div>
				<div class="column">
					<div class="box my-4">
						<h4 class="title is-4">Select Session</h4>
						<hr/>
						<aside class="menu">
							<ul class="menu-list">
								<li v-for="(item, index) in sessions">
									<a @click="session = index">
										<div class="columns">
											<div class="column">
												<span class="has-text-weight-semibold">Session {{ 1 + index }}</span>
											</div>
											<div class="column">
												<span>{{ item.length }} Total</span>
											</div>
										</div>
									</a>
								</li>
							</ul>
						</aside>
						<hr/>
						<button class="button" @click="session = 'summary'">Summary</button>
					</div>
				</div>
				<div class="column"></div>
			</div>
		</div>
		<div v-else-if="session === 'summary'">
			<div class="box m-4">
				<div class="level">
					<div class="level-item has-text-centered">
						<div>
							<p class="heading">Submissions</p>
							<p class="title">{{ paperCount }}</p>
						</div>
					</div>
					<div class="level-item has-text-centered">
						<div>
							<p class="heading">Rejected</p>
							<p class="title">{{ rejectedCount }}</p>
						</div>
					</div>
					<div class="level-item has-text-centered">
						<div>
							<p class="heading">Accepted</p>
							<p class="title">{{ acceptedCount }}</p>
						</div>
					</div>
					<div class="level-item has-text-centered">
						<div>
							<p class="heading">Acceptance Rate</p>
							<p class="title">{{ acceptanceRate }} %</p>
						</div>
					</div>
				</div>
				<hr/>
				<div class="columns">
					<div class="column">
						<h5 class="title is-5">Accepted Papers ({{ acceptedPapers.length }} / {{ paperCount }})</h5>
						<ul>
							<li v-for="paper in acceptedPapers" class="is-flex is-flex-direction-row">
								<span style="width: 3em;">#{{ paper.pid }}</span>
								<span>{{ paper.title }}</span>
							</li>
						</ul>
					</div>
					<div class="column is-one-third">
						<h5 class="title is-5">Breakdown by Session</h5>
						<table class="table is-fullwidth">
							<tr v-for="(item, index) in sessions">
								<th class="p-2">{{ 1 + index }}</th>
								<td class="p-2">
									<div class="is-flex is-flex-direction-row">
										<div class="has-background-warning has-text-centered" :style="{ 'width' : Math.round(100 * item.filter(p => !decisions[p.pid]).length / item.length) + '%' }">{{ item.filter(p => !decisions[p.pid]).length }}</div>
										<div class="has-background-danger has-text-centered" :style="{ 'width' : Math.round(100 * item.filter(p => decisions[p.pid] === 'X').length / item.length) + '%' }">{{ item.filter(p => decisions[p.pid] === 'X').length }}</div>
										<div class="has-background-success has-text-centered" :style="{ 'width' : Math.round(100 * item.filter(p => decisions[p.pid] === 'O').length / item.length) + '%' }">{{ item.filter(p => decisions[p.pid] === 'O').length }}</div>
									</div>
								</td>
							</tr>
						</table>
					</div>
				</div>
				<hr/>
				<div class="has-text-centered">
					<button class="button is-link" @click="downloadResults()">
						<span class="icon">
							<i class="fas fa-download"></i>
						</span>
						<span>Download Results</span>
					</button>
				</div>
			</div>
		</div>
		<div v-else class="p-4">
			<div class="columns">
				<div class="column is-one-quarter">
					<h4 class="title is-4">Session {{ 1 + session }}</h4>
					<p class="subtitle">{{ sessions[session].length }} Papers</p>
					<div style="max-height: 400px; overflow: auto;">
						<ul class="menu-list">
							<li v-for="paper in sessions[session]">
								<a @click="selectPaper(paper)" class="p-1" :class="{ 'is-active': viewing === paper }">
									<span>#{{ paper.pid }}</span>
									<span v-if="decisions[paper.pid] === 'O'" class="icon has-text-success">
										<i class="fas fa-check"></i>
									</span>
									<span v-else-if="decisions[paper.pid] === 'X'" class="icon has-text-danger">
										<i class="fas fa-times"></i>
									</span>
								</a>
							</li>
						</ul>
					</div>
				</div>
				<div class="column">

					<div v-if="viewing === null" class="box has-text-centered">
						<h3 class="title is-3">Session {{ 1 + session }}</h3>
						<hr/>
						<div class="field is-horizontal">
							<div class="field-label is-normal">
								<label class="label">Minutes per Paper</label>
							</div>
							<div class="field-body">
								<div class="field is-narrow">
									<div class="control">
										<input v-model="min_per_paper" class="input" type="number">
									</div>
								</div>
							</div>
						</div>
						<hr/>
						<button @click="selectPaper(sessions[session][0])" class="button is-link">Start Session</button>
					</div>

					<div v-else class="box has-text-centered">
						<div v-if="mode === 'NotReady'">
							<h4 class="title is-4">Paper #{{ viewing.pid }}</h4>
							<hr/>
							<article class="message is-danger mx-6">
								<div class="message-header">
									<p class="has-text-centered">PC Conflicts</p>
								</div>
								<div class="message-body">
									<ul>
										<li v-for="(val, email) in viewing.pc_conflicts">
											{{ committee[email] ? committee[email].first_name + ' ' + committee[email].last_name : email }}
										</li>
										<li v-if="!viewing.pc_conflicts || viewing.pc_conflicts.length === 0">
											None
										</li>
									</ul>
								</div>
							</article>
							<hr/>
							<button @click="mode = 'Ready'" class="button is-primary">
								Ready to Review Paper #{{ viewing.pid }}
							</button>
						</div>
						<div v-else>
							<p class="subtitle has-text-link">Currently Reviewing #{{ viewing.pid }}</p>
							<h4 class="title is-4">{{ viewing.title }}</h4>
							<hr/>
							<div class="columns">
								<div class="column">
									<countdown :startAt="min_per_paper * 60000"></countdown>
								</div>
								<div class="column">
									<h5 class="title is-5">PC Conflicts</h5>
									<ul>
										<li v-for="(val, email) in viewing.pc_conflicts">
											{{ committee[email] ? committee[email].first_name + ' ' + committee[email].last_name : email }}
										</li>
									</ul>
								</div>
							</div>
							<hr/>
							<h5 class="title is-5">Decision</h5>
							<button class="button" :class="{ 'is-warning' : !decision }" @click="updateDecision(viewing, null)">
								<span class="icon">
									<i class="fas fa-question"></i>
								</span>
								<span>Undecided</span>
							</button>
							<button class="button" :class="{ 'is-success' : decision === 'O' }" @click="updateDecision(viewing, 'O')">
								<span class="icon">
									<i class="fas fa-check"></i>
								</span>
								<span>Accept</span>
							</button>
							<button class="button" :class="{ 'is-danger' : decision === 'X' }" @click="updateDecision(viewing, 'X')">
								<span class="icon">
									<i class="fas fa-times"></i>
								</span>
								<span>Reject</span>
							</button>
							<hr/>
							<button v-if="nextPaper" class="button is-link" @click="selectPaper(nextPaper)">
								<span class="icon">
									<i class="fas fa-angle-right"></i>
								</span>
								<span>Next: Paper #{{ nextPaper.pid }}</span>
							</button>
							<button v-else class="button is-link" @click="reset()">
								<span class="icon">
									<i class="fas fa-flag-checkered"></i>
								</span>
								<span>End of Session {{ 1 + session }}</span>
							</button>
						</div>
					</div>

				</div>
			</div>
		</div>

		<footer class="footer py-4">
			<div class="content has-text-centered">
				<a href='https://github.com/DependableSystemsLab/PCMeetingDashboard' target='_blank'>
					<span class="icon">
						<i class="fab fa-github"></i>
					</span>
					DependableSystemsLab/PCMeetingDashboard
				</a>
				<p>Copyright &#169; 2022 Kumseok Jung. All rights reserved.</p>
			</div>
		</footer>
	</div>`
});

})();