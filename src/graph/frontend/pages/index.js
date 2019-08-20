import React from 'react';
import { Button, message } from 'antd';
import Graph from '../src/Graph.js';
import Activity from '../src/Activity.js';
import Model from '../src/model.js';
import { DOCUMENT_TITLE } from '../src/cons.js';
import 'antd/dist/antd.min.css';
import '../src/styles/main.css';

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.graphRef = React.createRef();
    this.state = {
      currentActivity: null,
    };
  }

  render() {
    return (
      <div className="vert" style={{alignItems: 'center'}}>
        <div>
          <Graph ref={this.graphRef}
            onActivitySelected={this.onActivitySelected}
          />
        </div>
        <Activity style={{flex: 1}} activity={this.state.currentActivity}/>
        <div>
          <hr/>
          <h3>Help</h3>
          <ul>
            <li>Right drag to do rectangluar select</li>
            <li>Double click to create new activity</li>
            <li>Select two activities and click "Link" to create relation</li>
            <li>Select relation and click "Reverse" to reverse</li>
          </ul>
        </div>
      </div>
    );
  }

  componentDidMount = async () => {
    document.title = DOCUMENT_TITLE;
    this.model = new Model();
    if (await this.model.fetch()) {
      this.graphRef.current.setupModel(this.model);
    } else {
      message.error('Failed to load activity graph');
    }
  }

  onActivitySelected = async (activity) => {
    console.log('onActivitySelected', activity);
    if (activity && activity.noteId && !activity.contentFetched) {
      await activity.fetchContent();
      this.setupLocalEdit(activity);
    }
    this.setState({currentActivity: activity});
  }

  setupLocalEdit = async (activity) => {
    const res = await fetch('http://ub:6560/current', {
      method: 'PUT',
      body: JSON.stringify({
        id: activity.noteId,
        content: activity.content,
      }),
    });
    if (res.status === 200) {
      if (!this.eventSource) {
        this.eventSource = new EventSource('http://ub:6560/current-content-change-event');
        this.eventSource.onmessage = (ev) => {
          const data = JSON.parse(ev.data);
          const targetActivity = this.model.getActivityByNoteId(data.id);
          if (targetActivity) {
            targetActivity.content = JSON.parse(ev.data).content;
            this.setState({});
          }
        };
      }
    }
  }
}
