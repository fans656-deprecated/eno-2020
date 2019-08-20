import React from 'react';
import { Button, Form, Input, Radio, Tabs, Icon, Checkbox } from 'antd';

export default class Activity extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const activity = this.props.activity;
    if (!activity) {
      return null;
    }
    return (
      <div className="vert" style={{width: '100%'}}>
        <Input
          value={activity.title}
          onChange={ev => {activity.title = ev.target.value; this.setState({})}}
          addonBefore="Title"
        />
        <div className="horz"
          style={{justifyContent: 'space-between', alignItems: 'center'}}
        >
          <Radio.Group
            value={activity.status}
            onChange={ev => {activity.status = ev.target.value; this.setState({})}}
          >
            <Radio.Button value="todo">Todo</Radio.Button>
            <Radio.Button value="doing">Doing</Radio.Button>
            <Radio.Button value="done">Done</Radio.Button>
          </Radio.Group>
          <Checkbox
            checked={activity.optional}
            onChange={ev => {activity.optional = ev.target.checked; this.setState({})}}
          >Optional</Checkbox>
        </div>
        <Input.TextArea style={{flex: 1}}
          rows={20}
          value={activity.content}
          onChange={ev => {activity.content = ev.target.value; this.setState({})}}
        />
      </div>
    );
  }
}
