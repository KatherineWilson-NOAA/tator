from rest_framework.schemas.openapi import AutoSchema

from ._attributes import attribute_filter_parameter_schema

class MediaPrevSchema(AutoSchema):
    def get_operation(self, path, method):
        operation = super().get_operation(path, method)
        operation['tags'] = ['Media']
        return operation

    def _get_path_parameters(self, path, method):
        return [{
            'name': 'id',
            'in': 'path',
            'required': True,
            'description': 'A unique integer identifying a media object.',
            'schema': {'type': 'integer'},
        }]

    def _get_filter_parameters(self, path, method):
        params = []
        if method  == 'GET':
            params = [
                {
                    'name': 'media_id',
                    'in': 'query',
                    'required': False,
                    'description': 'List of integers identifying media.',
                    'explode': False,
                    'schema': {
                        'type': 'array',
                        'items': {
                            'type': 'integer',
                            'minimum': 1,
                        },
                    },
                },
                {
                    'name': 'type',
                    'in': 'query',
                    'required': False,
                    'description': 'Unique integer identifying media type.',
                    'schema': {'type': 'integer'},
                },
                {
                    'name': 'name',
                    'in': 'query',
                    'required': False,
                    'description': 'Name of the media to filter on.',
                    'schema': {'type': 'string'},
                },
                {
                    'name': 'md5',
                    'in': 'query',
                    'required': False,
                    'description': 'MD5 sum of the media file.',
                    'schema': {'type': 'string'},
                },
            ] + attribute_filter_parameter_schema
        return params

    def _get_request_body(self, path, method):
        return {}

    def _get_responses(self, path, method):
        responses = {}
        responses['404'] = {'description': 'Failure to find project with given ID.'}
        responses['400'] = {'description': 'Bad request.'}
        if method == 'GET':
            responses['200'] = {'description': 'ID of previous media in the list corresponding to '
                                               'query.'}
            responses['200'] = {
                'description': 'ID of previous media in the list corresponding to query.',
                'content': {'application/json': {'schema': {
                    'type': 'object',
                    'properties': {
                        'prev': {'type': 'integer', 'minimum': 0},
                    },
                }}}
            }
        return responses
