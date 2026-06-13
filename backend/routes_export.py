from flask import Blueprint, jsonify, Response
from .auth import require_auth
from .models import MetaModelDefinition, MetaModelRelease, MetaModelReleaseItem
import yaml

bp_export = Blueprint('export', __name__, url_prefix='/api/export')


def _get_release_models(release_no: str):
    rel = MetaModelRelease.query.filter_by(release_no=release_no).first()
    if not rel:
        return None, None
    items = MetaModelReleaseItem.query.filter_by(release_id=rel.id).all()
    ids = [i.model_definition_id for i in items]
    models = MetaModelDefinition.query.filter(MetaModelDefinition.id.in_(ids)).all()
    result = {
        'version': release_no,
        'exported_at': rel.released_at.isoformat() if rel.released_at else None,
    }
    for m in models:
        result[m.model_type] = m.content_json
    return result, rel


@bp_export.get('/json/<release_no>')
@require_auth()
def export_json(release_no):
    result, rel = _get_release_models(release_no)
    if result is None:
        return jsonify({'error': 'not found'}), 404
    return jsonify(result)


@bp_export.get('/yaml/<release_no>')
@require_auth()
def export_yaml(release_no):
    result, rel = _get_release_models(release_no)
    if result is None:
        return jsonify({'error': 'not found'}), 404
    yaml_str = yaml.dump(result, allow_unicode=True, default_flow_style=False, sort_keys=False)
    return Response(yaml_str, mimetype='text/yaml')
