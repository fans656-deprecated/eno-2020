import uuidv4 from 'uuid/v4';
import { message } from 'antd';
import { truncatedTitle } from './utils.js';
import { NodeStatusStyle, DOCUMENT_TITLE } from './cons.js';

export default class Model {
  constructor() {
    this.dirty = newDirty();
    this.timer = null;
  }

  setupGraph(graph) {
    this.graph = graph;
  }

  async fetch() {
    const res = await fetch('/api/graph');
    if (res.status === 200) {
      const data = await res.json();

      this.viewport = data.viewport || {scale: 0.8, position: {x: 0, y: 0}};

      this.relations = [];
      this.idToRelation = {};
      for (const relationData of data.relations) {
        this.relations.push(relationData);
        this.idToRelation[relationData.id] = relationData;
      }

      this.activities = [];
      this.idToActivity = {};
      this.noteIdToActivity = {};
      for (const activityData of data.activities) {
        const activity = new Activity(this, activityData);
        this.activities.push(activity);
        this.idToActivity[activity.id] = activity;
        if (activity.noteId) {
          this.noteIdToActivity[activity.noteId] = activity;
        }
      }
      return true;
    }
  }

  getActivity(id) {
    return this.idToActivity[id];
  }

  getActivityByNoteId(id) {
    return this.noteIdToActivity[id];
  }

  getRelation(id) {
    console.log('getRelation', id, this.idToRelation);
    return this.idToRelation[id];
  }

  createActivity(pos) {
    const activityData = {
      id: uuidv4(),
      title: 'activity',
      x: pos.x,
      y: pos.y,
    };
    const activity = new Activity(this, activityData);
    this.idToActivity[activity.id] = activity;
    this.dirty.activities[activity.id] = activityData;
    this._schedulePost();
    return activity;
  }

  updateActivity(id, fields) {
    if (!this.dirty.activities[id]) {
      this.dirty.activities[id] = {};
    }
    Object.assign(this.dirty.activities[id], fields);
    this._schedulePost();
  }

  deleteActivities(ids) {
    const relations = [];
    for (const id of ids) {
      this.updateActivity(id, null);
      this.graph.edges.forEach(edge => {
        if (edge.from === id || edge.to === id) {
          relations.push(edge.id);
        }
      });
    }
    this._schedulePost();
    return true;
  }

  createRelation(activityIds) {
    const relation = {
      id: uuidv4(),
      from: activityIds[0],
      to: activityIds[1],
    };
    this.idToRelation[relation.id] = relation;
    this.dirty.relations[relation.id] = relation;
    this._schedulePost();
    return relation;
  }

  updateRelation(id, relation) {
    this.dirty.relations[id] = relation;
    this._schedulePost();
  }

  deleteRelations(ids) {
    for (const id of ids) {
      this.dirty.relations[id] = null;
    }
    this._schedulePost();
    return true;
  }

  updateNote(activity, content) {
    this.dirty.notes[activity.id] = {
      content: content,
    };
    this._schedulePost();
  }

  getViewport() {
    return this.viewport;
  }

  saveViewport(viewport) {
    console.log('saveViewport', viewport);
    this.dirty.viewport = viewport;
    this._schedulePost();
  }

  _schedulePost() {
    document.title = '* ' + DOCUMENT_TITLE;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(this._doPost, 1000);
  }

  _doPost = async () => {
    const res = await fetch('/api/graph', {
      method: 'PUT',
      body: JSON.stringify(this.dirty),
    });
    if (res.status === 200) {
      this.dirty = newDirty();
      document.title = 'Activities';
    } else {
      message.error('Failed to save');
    }
  }

  reverseRelationDirection = (relationId) => {
  }
}

class Activity {
  constructor(model, data) {
    this.model = model;
    this.data = data;
    this.noteId = this.data.note_id;

    this.label = truncatedTitle(this.title);
    this.id = data.id;
    this.x = data.x;
    this.y = data.y;
    Object.assign(this, this.nodeStyle);
  }

  get graph() {
    return this.model.graph;
  }

  get title() {
    return this.data.title;
  }

  set title(title) {
    this.data.title = title;
    this.graph.nodes.update({id: this.id, label: truncatedTitle(title)});
    this.model.updateActivity(this.id, {title: title});
  }

  get status() {
    return this.data.status || 'todo';
  }

  set status(status) {
    this.data.status = status;
    this.graph.nodes.update(Object.assign({id: this.id}, this.nodeStyle));
    this.model.updateActivity(this.id, {status: status});
  }

  get optional() {
    return this.data.optional;
  }

  set optional(optional) {
    this.data.optional = optional;
    this.graph.nodes.update(Object.assign({id: this.id}, this.nodeStyle));
    this.model.updateActivity(this.id, {optional: optional});
  }

  get content() {
    return this.data.content || '';
  }

  set content(content) {
    this.data.content = content;
    this.model.updateNote(this, content);
  }

  set pos(pos) {
    this.model.updateActivity(this.id, pos);
  }

  fetchContent = async () => {
    const res = await fetch(`/api/note/${this.noteId}`);
    if (res.status === 200) {
      const data = await res.json();
      this.data.content = data.content;
    } else {
      message.error('Failed to fetch note');
    }
  }

  get nodeStyle() {
    return Object.assign({}, NodeStatusStyle[this.status], {
      font: {color: this.status !== 'done' && this.optional ? '#999' : '#222'},
    });
  }
}

function newDirty() {
  return {
    activities: {},
    relations: {},
    notes: {},
  };
}
