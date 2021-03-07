import os
import logging
from uuid import uuid1

import boto3
from rest_framework.exceptions import PermissionDenied

from ..models import Project
from ..schema import DownloadInfoSchema
from ..s3 import TatorS3
from ..util import get_s3_lookup

from ._base_views import BaseListView
from ._permissions import ProjectTransferPermission

logger = logging.getLogger(__name__)

class DownloadInfoAPI(BaseListView):
    """ Retrieve info needed to download a file.
    """
    schema = DownloadInfoSchema()
    permission_classes = [ProjectTransferPermission]
    http_method_names = ['post']

    def _post(self, params):

        # Parse parameters.
        keys = params['keys']
        expiration = params['expiration']
        project = params['project']

        # Get resource objects for these keys.
        resources = Resource.objects.filter(path__in=keys)
        s3_lookup = get_s3_lookup(resources)

        # Set up S3 interfaces.
        response_data = []
        for key in keys:
            s3 = s3_lookup[key]
            # Make sure the key corresponds to the correct project.
            project_from_key = int(key.split('/')[1])
            if project != project_from_key:
                raise PermissionDenied
            # Generate presigned url.
            url = s3.get_download_url(key, expiration)
            response_data.append({'key': key, 'url': url})
        return response_data

