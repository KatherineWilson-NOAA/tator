from django.db import transaction

from ..models import MediaType
from ..models import Media
from ..models import Project
from ..schema import MediaTypeListSchema
from ..schema import MediaTypeDetailSchema

from ._base_views import BaseListView
from ._base_views import BaseDetailView
from ._permissions import ProjectFullControlPermission
from ._attribute_keywords import attribute_keywords

fields = ['id', 'project', 'name', 'description', 'dtype', 'attribute_types', 'file_format',
          'default_volume', 'visible', 'archive_config', 'streaming_config','overlay_config']

class MediaTypeListAPI(BaseListView):
    """ Create or retrieve media types.

        A media type is the metadata definition object for media. It includes file format,
        name, description, and (like other entity types) may have any number of attribute
        types associated with it.
    """
    schema = MediaTypeListSchema()
    permission_classes = [ProjectFullControlPermission]
    queryset = MediaType.objects.all()
    http_method_names = ['get', 'post']

    def _get(self, params):
        """ Retrieve media types.

            A media type is the metadata definition object for media. It includes file format,
            name, description, and (like other entity types) may have any number of attribute
            types associated with it.
        """
        media_id = params.get('media_id', None)
        if media_id != None:
            if len(media_id) != 1:
                raise Exception('Entity type list endpoints expect only one media ID!')
            media_element = Media.objects.get(pk=media_id[0])
            if media_element.project.id != self.kwargs['project']:
                raise Exception('Media not in project!')
            response_data = MediaType.objects.filter(pk=media_element.meta.pk).values(*fields)
        else:
            response_data = MediaType.objects.filter(project=self.kwargs['project']).values(*fields)
        return list(response_data)

    def _post(self, params):
        """ Create media type.

            A media type is the metadata definition object for media. It includes file format,
            name, description, and (like other entity types) may have any number of attribute
            types associated with it.
        """
        if params['name'] in attribute_keywords:
            raise ValueError(f"{params['name']} is a reserved keyword and cannot be used for "
                              "an attribute name!")
        params['project'] = Project.objects.get(pk=params['project'])
        del params['body']
        obj = MediaType(**params)
        obj.save()
        return {'id': obj.id, 'message': 'Media type created successfully!'}

class MediaTypeDetailAPI(BaseDetailView):
    """ Interact with an individual media type.

        A media type is the metadata definition object for media. It includes file format,
        name, description, and (like other entity types) may have any number of attribute
        types associated with it.
    """
    schema = MediaTypeDetailSchema()
    permission_classes = [ProjectFullControlPermission]
    lookup_field = 'id'
    http_method_names = ['get', 'patch', 'delete']

    def _get(self, params):
        """ Get media type.

            A media type is the metadata definition object for media. It includes file format,
            name, description, and (like other entity types) may have any number of attribute
            types associated with it.
        """
        return MediaType.objects.filter(pk=params['id']).values(*fields)[0]

    @transaction.atomic
    def _patch(self, params):
        """ Update media type.

            A media type is the metadata definition object for media. It includes file format,
            name, description, and (like other entity types) may have any number of attribute
            types associated with it.
        """
        name = params.get('name', None)
        description = params.get('description', None)
        file_format = params.get('file_format', None)
        archive_config = params.get('archive_config', None)
        streaming_config = params.get('streaming_config', None)
        overlay_config = params.get('overlay_config', None)

        obj = MediaType.objects.get(pk=params['id'])
        if name is not None:
            obj.name = name
        if description is not None:
            obj.description = description
        if file_format is not None:
            obj.file_format = file_format
        if archive_config is not None:
            obj.archive_config = archive_config
        if streaming_config is not None:
            obj.streaming_config = streaming_config
        if overlay_config is not None:
            obj.overlay_config = overlay_config

        obj.save()
        return {'message': 'Media type updated successfully!'}

    def _delete(self, params):
        """ Delete media type.

            A media type is the metadata definition object for media. It includes file format,
            name, description, and (like other entity types) may have any number of attribute
            types associated with it.
        """
        MediaType.objects.get(pk=params['id']).delete()
        return {'message': f'Media type {params["id"]} deleted successfully!'}

    def get_queryset(self):
        return MediaType.objects.all()

