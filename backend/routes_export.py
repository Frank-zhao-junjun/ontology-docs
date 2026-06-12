from flask import Blueprint, jsonify
from .auth import require_auth
from .models import MetaModelDefinition, MetaModelRelease, MetaModelReleaseItem

bp_export = Blueprint('export', __name__, url_prefix='/api/export')


@bp_export.get('/json/<release_no>')
@require_auth()
def export_json(release_no):
    rel = MetaModelRelease.query.filter_by(release_no=release_no).first()
    if not rel:
        return jsonify({'error': 'not found'}), 404
    items = MetaModelReleaseItem.query.filter_by(release_id=rel.id).all()
    ids = [i.model_definition_id for i in items]
    models = MetaModelDefinition.query.filter(MetaModelDefinition.id.in_(ids)).all()
    result = {
        'version': release_no,
        'exported_at': rel.released_at.isoformat() if rel.released_at else None,
    }
    for m in models:
        result[m.model_type] = m.content_json
    return jsonify(result)
