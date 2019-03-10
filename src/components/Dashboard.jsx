import React from 'react';
import {hot} from 'react-hot-loader';
import { Select, Button, Header, Statistic, Container, Input,
	Divider, Segment, Grid, Icon, List } from 'semantic-ui-react';

function formatTime(ms){
	return (ms<0?'-':'')+('00'+(Math.floor(Math.abs(ms)/3600000)%24)).slice(-2)+':'+('00'+(Math.floor(Math.abs(ms)/60000)%3600)).slice(-2)+':'+('00'+(Math.floor(Math.abs(ms)/1000)%60)).slice(-2)
}

class Countdown extends React.Component {
	constructor (props){
		super();

		this.state = {
			// paused: !!props.pauseOnMount,
			current: props.startValue
		}

		this.timer = null;
	}

	componentDidMount(){
		if (!this.props.pauseOnMount) this.resume();
	}

	componentWillUnmount(){
		clearInterval(this.timer);
	}

	toggle (){
		if (this.timer !== null) this.pause();
		else this.resume();
	}

	pause (){
		clearInterval(this.timer);
		this.timer = null;
		this.setState({ paused: true });
	}

	resume (){
		this.timer = setInterval(()=>(this.setState({
			current: this.state.current - 1000
		})), 1000);
		this.setState({ paused: false });
	}

	render() {
		return (
			<Statistic label='time' value={formatTime(this.state.current)} 
				color={this.state.paused ? 'grey' : (this.state.current < 0 ? 'red' : 'green') }
				onClick={(e)=>this.toggle ()}
				style={{ cursor:'pointer' }}/>
		)
	}
}

class DecisionStore {
	constructor (){
		this.reload();
	}

	reload (){
		this.data = JSON.parse(window.localStorage.getItem('DecisionStore')) || {};
	}

	updatePaper (pid, decision){
		this.data[pid] = decision;
		window.localStorage.setItem('DecisionStore', JSON.stringify(this.data));
		// console.log('Decision for Paper '+pid+' updated: '+decision);
	}
}

class Dashboard extends React.Component {
	constructor (props){
		super();

		this.sessionOptions = props.sessions.map((item, index)=>({ key: index, value: index, text: 'Session '+(1+index) }));

		this.state = {
			session: null,
			min_per_paper: 3,
			viewing: null,
			mode: 'NotReady',
			decision: null
		}

		this.decisions = new DecisionStore();

	}

	componentDidMount (){
		let savedState = JSON.parse(window.localStorage.getItem('DashboardState'));
		// console.log(savedState);
		if (savedState) this.setState(savedState);
	}

	componentDidUpdate (prevProps, prevState, snapshot){
		window.localStorage.setItem('DashboardState', JSON.stringify(this.state));
		// console.log('Saved State');
		if (prevState.viewing !== this.state.viewing && this.state.viewing !== null){
			// console.log('Viewing Changed');
			this.setState({
				decision: this.decisions.data[this.props.sessions[this.state.session][this.state.viewing].pid]
			});
		}
	}

	reset (){
		this.setState({ 
			session: null,
			mode: 'NotReady',
			viewing: null,
			decision: null
		});
	}

	updateDecision (paper_pid, decision){
		this.decisions.updatePaper(paper_pid, decision);
		this.setState({
			decision: this.decisions.data[paper_pid]
		});
	}

	render(){
		let view;
		if (this.state.session === null){
			view = (
				<Grid>
					<Grid.Column textAlign='center'>
						<Select placeholder='Select Session' 
							options={this.sessionOptions}
							onChange={(e, data)=>(this.setState({ session: data.value }))}/>
					</Grid.Column>
				</Grid>
			)
		}
		else {
			view = (<div>
				<Header as='h1'>Session {1+this.state.session}</Header>
				<Grid>
					<Grid.Column width={4}>
						<Header as='h4'>{this.props.sessions[this.state.session].length} Papers</Header>
						<List divided style={{ maxHeight: '400px', overflow: 'auto' }}>
							{
								this.props.sessions[this.state.session].map((paper, index)=>(
									<List.Item key={paper.pid} style={{ cursor: 'pointer', backgroundColor: index===this.state.viewing ? 'yellow' : null }}
										onClick={(e)=>(this.setState({
											viewing: index,
											mode: 'NotReady'
										}))}>
										{
											this.decisions.data[paper.pid] ?
											(this.decisions.data[paper.pid] === 'Accept' ? 
												<Icon name='check' color='green'/> : <Icon name='close' color='red'/>) 
											: null
										}
										#{paper.pid}
									</List.Item>
								))
							}
						</List>
					</Grid.Column>
					<Grid.Column width={12}>
						<Segment textAlign='center'>

							{
								this.state.viewing === null ?
								(<div>
									<Header as='h3'>Session {1+this.state.session}</Header>
									<Divider/>
									Minutes per paper = <Input type='number' min={1} value={this.state.min_per_paper} onChange={(e)=>(this.setState({ min_per_paper: e.target.value }))}/>
									<Divider/>
									<Button onClick={(e)=>(this.setState({ viewing: 0 }))} color='blue'>
										Start Session
									</Button>
								</div>)
								: (this.state.mode === 'NotReady' ? (
										<div>
											<Header>PC Conflicts</Header>
											<Divider/>
											{
												this.props.sessions[this.state.session][this.state.viewing].pc_conflicts ? 
												<List divided>
													{
														Object.keys(this.props.sessions[this.state.session][this.state.viewing].pc_conflicts).map((email, index)=>(
															<List.Item key={index}>
																{
																	this.props.committee[email] ?
																	<List.Header as='h4'>
																		{this.props.committee[email].first_name +' '+ this.props.committee[email].last_name}
																	</List.Header>
																	:<List.Content>
																		{email} (Not Present)
																	</List.Content>
																}
															</List.Item>
														))
													}
												</List>
												: <div>None</div>
											}

											<Divider/>

											<Button onClick={(e)=>(this.setState({
												mode: 'Ready'
											}))} color='green'>
												Ready to Review Paper #{this.props.sessions[this.state.session][this.state.viewing].pid}
											</Button>
										</div>
									)
									:(<div>
										<Header as='h4' color='green'>({this.state.viewing}) Currently Reviewing #{this.props.sessions[this.state.session][this.state.viewing].pid}</Header>
										<Header as='h2'>{this.props.sessions[this.state.session][this.state.viewing].title}</Header>
										<Divider/>

										<Grid>
											<Grid.Column width={9}>
												<Countdown startValue={this.state.min_per_paper * 60000}/>
											</Grid.Column>
											<Grid.Column width={7}>
												<Header>PC Conflicts</Header>
												{
													this.props.sessions[this.state.session][this.state.viewing].pc_conflicts ? 
													<List divided>
														{
															Object.keys(this.props.sessions[this.state.session][this.state.viewing].pc_conflicts).map((email, index)=>(
																<List.Item key={index}>
																	{
																		this.props.committee[email] ?
																		<List.Header as='h4'>
																			{this.props.committee[email].first_name +' '+ this.props.committee[email].last_name}
																		</List.Header>
																		:<List.Content>
																			{email} (Not Present)
																		</List.Content>
																	}
																</List.Item>
															))
														}
													</List>
													: <div>None</div>
												}
											</Grid.Column>
										</Grid>

										<Divider/>

										<Header as='h4'>Decision</Header>
										<Button color={this.decisions.data[this.props.sessions[this.state.session][this.state.viewing].pid] ? null : 'grey' } onClick={(e)=>(this.updateDecision(this.props.sessions[this.state.session][this.state.viewing].pid, null))} content='Undecided'/>
										<Button color={this.decisions.data[this.props.sessions[this.state.session][this.state.viewing].pid] === 'Accept' ? 'green' : null} onClick={(e)=>(this.updateDecision(this.props.sessions[this.state.session][this.state.viewing].pid, 'Accept'))} icon='check' content='Accept'/>
										<Button color={this.decisions.data[this.props.sessions[this.state.session][this.state.viewing].pid] === 'Reject' ? 'red' : null} onClick={(e)=>(this.updateDecision(this.props.sessions[this.state.session][this.state.viewing].pid, 'Reject'))} icon='close' content='Reject'/>
										<Divider/>

										<div>
										{
											(this.state.viewing === this.props.sessions[this.state.session].length - 1) ?
											<Button onClick={(e)=>this.reset()} color='red'>
												End of Session
											</Button>
											:<Button onClick={(e)=>(this.setState({
												mode: 'NotReady',
												viewing: this.state.viewing === null ? 0 : this.state.viewing + 1
											}))} color='red'>
												Next: Paper #{this.props.sessions[this.state.session][1+this.state.viewing].pid}
											</Button>
										}
										</div>
									</div>)
								)
								
							}
						</Segment>
					</Grid.Column>
				</Grid>
			</div>)
		}

		return (
			<Container>
				<div>
					<Button onClick={(e)=>this.reset()} icon='home'></Button>
					Minutes per paper = <Input type='number' min={1} value={this.state.min_per_paper} onChange={(e)=>(this.setState({ min_per_paper: e.target.value }))}/>
				</div>
				{view}
			</Container>
		)
	}
}

export default hot(module)(Dashboard);