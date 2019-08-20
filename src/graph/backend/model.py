import os
import json
import uuid

import conf


class Model:

    def __init__(self, raw=False):
        self.data = self.load()
        if not raw:
            self.id_to_activity = {a['id']: a for a in self.data['activities']}
            self.id_to_relation = {r['id']: r for r in self.data['relations']}

    def get_activity(self, activity_id):
        return self.id_to_activity.get(activity_id)

    def get_relation(self, relation_id):
        return self.id_to_relation.get(relation_id)

    def load(self):
        with open(conf.DATA_JSON) as f:
            return json.load(f)

    def save(self):
        with open(conf.DATA_JSON, 'w') as f:
            json.dump(self.data, f, indent=2, sort_keys=True)

    def update(self, delta):
        for activity_id, fields in delta['activities'].items():
            activity = self.get_activity(activity_id)
            if not activity:
                self.create_activity(fields)
                continue
            if not fields:
                self.delete_activity(activity_id)
                continue
            for key, value in fields.items():
                activity[key] = value
        for relation_id, fields in delta['relations'].items():
            relation = self.get_relation(relation_id)
            if not relation:
                self.create_relation(fields)
                continue
            if not fields:
                self.delete_relation(relation_id)
                continue
            relation.update(fields)
        for activity_id, note in delta['notes'].items():
            activity = self.get_activity(activity_id)
            if not activity:
                continue
            self.save_note(activity, note)
        viewport = delta.get('viewport')
        if viewport:
            self.data['viewport'] = viewport
        return self

    def get_note(self, note_id):
        note_path = os.path.join(conf.NOTES_DIR, note_id + '.md')
        with open(note_path) as f:
            content = f.read()
        return {'content': content}

    def save_note(self, activity, note):
        if not os.path.exists(conf.NOTES_DIR):
            os.makedirs(conf.NOTES_DIR)
        note_id = activity.setdefault('note_id', str(uuid.uuid4()))
        note_path = os.path.join(conf.NOTES_DIR, note_id + '.md')
        with open(note_path, 'w') as f:
            f.write(note['content'])

    def delete_note(self, note_id):
        note_path = os.path.join(conf.NOTES_DIR, note_id + '.md')
        os.remove(note_path)

    def create_activity(self, activity):
        self.id_to_activity[activity['id']] = activity
        self.data['activities'].append(activity)

    def delete_activity(self, activity_id):
        activity = self.get_activity(activity_id)
        self.data['activities'] = [a for a in self.data['activities'] if a['id'] != activity_id]
        del self.id_to_activity[activity_id]
        note_id = activity.get('note_id')
        if note_id:
            self.delete_note(note_id)

    def create_relation(self, relation):
        self.id_to_relation[relation['id']] = relation
        self.data['relations'].append(relation)

    def delete_relation(self, relation_id):
        self.data['relations'] = [r for r in self.data['relations'] if r['id'] != relation_id]
        del self.id_to_relation[relation_id]
