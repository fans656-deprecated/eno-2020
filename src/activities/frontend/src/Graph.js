import React from 'react';
import { message, notification } from 'antd';
import { Button } from 'antd';
import vis from 'visjs-network';
import { noop } from './utils.js';
import { NETWORK_OPTIONS } from './cons.js';

export default class Graph extends React.Component {
  constructor(props) {
    super(props);
    this.onActivitySelected = props.onActivitySelected || noop;
    this.rectangleSelecting = false;
  }

  render() {
    return (
      <div>
        <div id="vis-container" ref="vis" style={{width: 1500, height: 600}}/>
        <div className="horz" style={{justifyContent: 'space-between'}}>
          <div>
            <Button onClick={this.onCommit} title="Commit current snapshot"
            >Commit</Button>
            <Button onClick={this.onReset} title="Reset to last snapshot"
            >Reset</Button>
            <Button onClick={this.onStatus} title="Snapshot status"
            >Status</Button>
            <Button onClick={this.onCreate} title="Create activity"
            >Create</Button>
            <Button onClick={this.onDelete} title="Delete activity/relation"
            >Delete</Button>
          </div>
          <div>
            <Button onClick={this.onLink} title="Link two nodes"
            >Link</Button>
            <Button onClick={this.onReverse} title="Reverse link direction"
            >Reverse</Button>
          </div>
        </div>
      </div>
    );
  }

  setupModel = (model) => {
    this.model = model;
    this.graph = {
      nodes: new vis.DataSet(model.activities),
      edges: new vis.DataSet(model.relations),
    };
    this.model.setupGraph(this.graph);
    this.network = new vis.Network(this.refs.vis, this.graph, NETWORK_OPTIONS);
    this.network.moveTo(this.model.getViewport());
    this.network.on('click', this.onClick);
    this.network.on('doubleClick', this.onDoubleClick);
    this.network.on('dragEnd', this.onDragEnd);
    this.canvas = this.network.canvas.frame.canvas;
    this.ctx = this.canvas.getContext('2d');

    this.refs.vis.addEventListener('mousedown', ev => {
      if (ev.button === 2) {
        ev.preventDefault();
        this.onRectangleSelectionStart(ev);
      }
    });
    this.refs.vis.addEventListener('mousemove', ev => {
      if (this.rectangleSelecting) {
        ev.preventDefault();
        this.onRectangleSelectionDragging(ev);
      }
    });
    this.refs.vis.addEventListener('mouseup', ev => {
      if (ev.button === 2) {
        ev.preventDefault();
        this.onRectangleSelectionEnd(ev);
      }
    });
    this.refs.vis.oncontextmenu = () => false;
  }

  onClick = (ev) => {
    if (ev.nodes.length === 1) {
      this.onActivitySelected(this.model.getActivity(ev.nodes[0]));
    } else {
      this.onActivitySelected(null);
    }
  }

  onDoubleClick = (ev) => {
    this.createActivity(ev.pointer.canvas, ev.nodes[0]);
  }

  onDragEnd = (ev) => {
    if (ev.nodes.length > 0) {
      this.onNodesMoved(ev);
    } else {
      const scale = this.network.getScale();
      const pos = this.network.getViewPosition();
      this.model.saveViewport({scale: scale, position: pos});
    }
  }

  onCreate = () => {
    this.createActivity(this.network.getViewPosition(), null);
  }

  onLink = () => {
    const nodes = this.network.getSelectedNodes();
    if (nodes.length === 2) {
      const edge = this.model.createRelation(nodes);
      this.graph.edges.add(edge);
    } else {
      message.error('Can only link two nodes');
    }
  }

  onReverse = () => {
    const edges = this.network.getSelectedEdges();
    for (const edge of edges) {
      const relation = this.model.getRelation(edge);
      [relation.from, relation.to] = [relation.to, relation.from];
      this.model.updateRelation(relation.id, relation);
      this.graph.edges.update(relation);
    }
  }

  onDelete = () => {
    const nodes = this.network.getSelectedNodes();
    const edges = this.network.getSelectedEdges();
    if (this.model.deleteActivities(nodes)) {
      this.graph.nodes.remove(nodes);
    }
    if (this.model.deleteRelations(edges)) {
      this.graph.edges.remove(edges);
    }
  }

  onCommit = async () => {
    const res = await fetch('/api/commit', {
      method: 'POST',
    });
    if (res.status === 200) {
      message.success('Commited');
    } else {
      message.error('Failed to commit');
    }
  }

  onReset = async () => {
    const res = await fetch('/api/reset', {
      method: 'POST',
    });
    if (res.status === 200) {
      window.location.reload(true);
    } else {
      message.error('Failed to reset');
    }
  }

  onStatus = async () => {
    const res = await fetch('/api/status');
    if (res.status === 200) {
      const data = await res.json();
      const content = data.content;
      let notify;
      if (content.includes('nothing')) {
        notify = notification.success;
      } else {
        notify = notification.info;
      }
      notify({
        message: 'Status',
        description: (
          <pre style={{
            fontFamily: 'Consolas',
            fontSize: '.8em'
          }}>{data.content}</pre>
        ),
      });
    } else {
      message.error('Failed to fetch status');
    }
  }

  onNodesMoved = (ev) => {
    const positions = this.network.getPositions(ev.nodes);
    for (const id in positions) {
      const activity = this.model.getActivity(id);
      activity.pos = positions[id];
    };
  }

  onRectangleSelectionStart = (ev) => {
    this.network.setOptions({interaction: {hover: false}});
    this.rectangleSelecting = true;
    const x = ev.pageX - this.refs.vis.offsetLeft;
    const y = ev.pageY - this.refs.vis.offsetTop;
    this.rectangleSelectionBegPos = {x: x, y: y};
    this.drawingSurfaceImageData = this.ctx.getImageData(
      0, 0, this.canvas.width, this.canvas.height);
  }

  onRectangleSelectionDragging = (ev) => {
    this.ctx.putImageData(this.drawingSurfaceImageData, 0, 0);
    const begPos = this.rectangleSelectionBegPos;
    const x = ev.pageX - this.refs.vis.offsetLeft;
    const y = ev.pageY - this.refs.vis.offsetTop;
    this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
    this.ctx.fillRect(begPos.x, begPos.y, x - begPos.x, y - begPos.y);
  }

  onRectangleSelectionEnd = (ev) => {
    this.network.setOptions({interaction: {hover: true}});
    this.ctx.putImageData(this.drawingSurfaceImageData, 0, 0);
    this.rectangleSelecting = false;
    const x = ev.pageX - this.refs.vis.offsetLeft;
    const y = ev.pageY - this.refs.vis.offsetTop;

    let left = Math.min(x, this.rectangleSelectionBegPos.x);
    let top = Math.min(y, this.rectangleSelectionBegPos.y);
    let right = Math.max(x, this.rectangleSelectionBegPos.x);
    let bottom = Math.max(y, this.rectangleSelectionBegPos.y);
    const topLeft = this.network.DOMtoCanvas({x: left, y: top});
    const rightBottom = this.network.DOMtoCanvas({x: right, y: bottom});
    left = topLeft.x;
    top = topLeft.y;
    right = rightBottom.x;
    bottom = rightBottom.y;
    const nodeIds = [];
    this.graph.nodes.forEach(node => {
      if (left <= node.x && node.x <= right && top <= node.y && node.y <= bottom) {
        nodeIds.push(node.id);
      }
    });
    this.network.selectNodes(nodeIds);
  }

  createActivity = (pos, nodeId) => {
    const activity = this.model.createActivity(pos);
    this.network.body.data.nodes.add(activity);
  }
}
