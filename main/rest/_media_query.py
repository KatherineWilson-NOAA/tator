""" TODO: add documentation for this """
from collections import defaultdict

from urllib import parse as urllib_parse

from ..search import TatorSearch
from ..models import Section

from ._attribute_query import get_attribute_query
from ._attributes import AttributeFilterMixin


def get_media_queryset(project, query_params, dry_run=False):
    """Converts raw media query string into a list of IDs and a count.
    """
    media_id = query_params.get('media_id', None)
    filter_type = query_params.get('type', None)
    name = query_params.get('name', None)
    section = query_params.get('section', None)
    dtype = query_params.get('dtype', None)
    md5 = query_params.get('md5', None)
    gid = query_params.get('gid', None)
    uid = query_params.get('uid', None)
    start = query_params.get('start', None)
    stop = query_params.get('stop', None)
    after = query_params.get('after', None)

    query = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(dict))))
    query['sort']['_exact_name'] = 'asc'
    bools = [{'bool': {
        'should': [
            {'match': {'_dtype': 'image'}},
            {'match': {'_dtype': 'video'}},
            {'match': {'_dtype': 'multi'}},
        ],
        'minimum_should_match': 1,
    }}]
    annotation_bools = []

    if media_id is not None:
        ids = [f'image_{id_}' for id_ in media_id] + [f'video_{id_}' for id_ in media_id]\
            + [f'multi_{id_}' for id_ in media_id]
        bools.append({'ids': {'values': ids}})

    if filter_type is not None:
        bools.append({'match': {'_meta': {'query': int(filter_type)}}})

    if name is not None:
        bools.append({'match': {'_exact_name': {'query': name}}})

    if section is not None:
        section_object = Section.objects.get(pk=section)
        if section_object.lucene_search:
            bools.append({'bool': {
                'should': [
                    {'query_string': {'query': section_object.lucene_search}},
                    {'has_child': {
                        'type': 'annotation',
                        'query': {'query_string': {'query': section_object.lucene_search}},
                        },
                    },
                ],
                'minimum_should_match': 1,
            }})
        if section_object.media_bools:
            bools.append(section_object.media_bools)
        if section_object.annotation_bools:
            annotation_bools.append(section_object.annotation_bools)
        if section_object.tator_user_sections:
            bools.append({'match': {'tator_user_sections': {
                'query': section_object.tator_user_sections,
            }}})

    if dtype is not None:
        bools.append({'match': {'_dtype': {'query': dtype}}})

    if md5 is not None:
        bools.append({'match': {'_md5': {'query': md5}}})

    if gid is not None:
        bools.append({'match': {'_gid': {'query': gid}}})

    if uid is not None:
        bools.append({'match': {'_uid': {'query': uid}}})

    if start is not None:
        query['from'] = int(start)
        if start > 10000:
            raise ValueError("Parameter 'start' must be less than 10000! Try using 'after'.")

    if start is None and stop is not None:
        query['size'] = int(stop)
        if stop > 10000:
            raise ValueError("Parameter 'stop' must be less than 10000! Try using 'after'.")

    if start is not None and stop is not None:
        query['size'] = int(stop) - int(start)
        if stop > 10000:
            raise ValueError("Parameter 'stop' must be less than 10000! Try using "
                             "'after'.")

    if after is not None:
        bools.append({'range': {'_exact_name': {'gt': after}}})

    query = get_attribute_query(query_params, query, bools, project, is_media=True,
                                annotation_bools=annotation_bools)

    if dry_run:
        return [], [], query

    media_ids, media_count = TatorSearch().search(project, query)

    return media_ids, media_count, query

def query_string_to_media_ids(project_id, url):
    """ TODO: add documentation for this """
    query_params = dict(urllib_parse.parse_qsl(urllib_parse.urlsplit(url).query))
    attribute_filter = AttributeFilterMixin()
    attribute_filter.validate_attribute_filter(query_params)
    media_ids, _, _ = get_media_queryset(project_id, query_params)
    return media_ids
