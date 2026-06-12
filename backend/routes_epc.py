from flask import Blueprint, jsonify, request
from .auth import require_auth
from .extensions import db
from .models import MetaModelDefinition

bp_epc = Blueprint('epc', __name__, url_prefix='/api/epc')


@bp_epc.post('/processes')
@require_auth()
def create_epc():
    p = request.get_json(force=True)
    m = MetaModelDefinition(model_type='epc', name=p['name'], version='1.0.0',
        content_json={'steps': p.get('steps',[]), 'scenario': p.get('scenario','')},
        status='draft')
    db.session.add(m); db.session.commit()
    return jsonify({'id': m.id, 'name': m.name, 'steps': p.get('steps',[])}), 201


@bp_epc.get('/processes')
@require_auth()
def list_epc():
    rows = MetaModelDefinition.query.filter_by(model_type='epc').all()
    return jsonify({'items': [{'id': r.id, 'name': r.name, 'content': r.content_json} for r in rows]})
