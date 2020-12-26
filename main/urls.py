import os
import logging

from django.urls import path
from django.urls import include
from django.conf.urls import url
from django.conf import settings

from rest_framework.authtoken import views
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.documentation import include_docs_urls
from rest_framework.schemas import get_schema_view

from .views import APIBrowserView
from .views import MainRedirect
from .views import ProjectsView
from .views import CustomView
from .views import ProjectDetailView
from .views import ProjectSettingsView
from .views import AnnotationView
from .views import AuthProjectView
from .views import AuthAdminView
from .views import AuthUploadView

from .schema import NoAliasRenderer
from .schema import CustomGenerator

from .rest import *

logger = logging.getLogger(__name__)

schema_view = get_schema_view(
    title='Tator REST API',
    version='v1',
    generator_class=CustomGenerator,
    renderer_classes=[NoAliasRenderer],
)

urlpatterns = [
    path('', MainRedirect.as_view(), name='home'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('projects/', ProjectsView.as_view(), name='projects'),
    path('new-project/custom/', CustomView.as_view(), name='custom'),
    path('<int:project_id>/project-detail', ProjectDetailView.as_view(), name='project-detail'),
    path('<int:project_id>/project-settings', ProjectSettingsView.as_view(), name='project-settings'),
    path('<int:project_id>/annotation/<int:id>', AnnotationView.as_view(), name='annotation'),
    path('auth-project', AuthProjectView.as_view()),
    path('auth-admin', AuthAdminView.as_view()),
    path('auth-upload', AuthUploadView.as_view()),
]

if settings.COGNITO_ENABLED:
    urlpatterns += [
        path('jwt-gateway/', JwtGatewayAPI.as_view(), name='jwt-gateway')]

# This is used for REST calls
urlpatterns += [
    url(r'^rest/Token', views.obtain_auth_token),
    path('rest/', APIBrowserView.as_view()),
    path('schema/', schema_view, name='schema'),
    path(
        'rest/Affiliations/<int:organization>',
        AffiliationListAPI.as_view(),
    ),
    path(
        'rest/Affiliation/<int:id>',
        AffiliationDetailAPI.as_view(),
    ),
    path(
        'rest/AlgorithmLaunch/<int:project>',
        AlgorithmLaunchAPI.as_view(),
    ),
    path(
        'rest/Algorithms/<int:project>',
        AlgorithmListAPI.as_view(),
    ),
    path(
        'rest/Algorithm/<int:id>',
        AlgorithmDetailAPI.as_view(),
    ),
    path(
        'rest/SaveAlgorithmManifest/<int:project>',
        SaveAlgorithmManifestAPI.as_view(),
        name='SaveAlgorithmManifest',
    ),
    path(
        'rest/Analyses/<int:project>',
        AnalysisListAPI.as_view(),
    ),
    path(
        'rest/Analysis/<int:id>',
        AnalysisDetailAPI.as_view(),
    ),
    path(
        'rest/Bookmarks/<int:project>',
        BookmarkListAPI.as_view(),
    ),
    path(
        'rest/Bookmark/<int:id>',
        BookmarkDetailAPI.as_view(),
    ),
    path('rest/CloneMedia/<int:project>',
         CloneMediaListAPI.as_view(),
    ),
    path('rest/DownloadInfo/<int:project>',
         DownloadInfoAPI.as_view(),
    ),
    path('rest/Favorites/<int:project>',
         FavoriteListAPI.as_view(),
    ),
    path('rest/Favorite/<int:id>',
         FavoriteDetailAPI.as_view(),
    ),
    path('rest/GetFrame/<int:id>',
         GetFrameAPI.as_view(),
    ),
    path('rest/GetClip/<int:id>',
         GetClipAPI.as_view(),
    ),
    path(
        'rest/Jobs/<int:project>',
        JobListAPI.as_view(),
    ),
    path(
        'rest/Job/<str:uid>',
        JobDetailAPI.as_view(),
    ),
    path(
        'rest/Leaves/Suggestion/<str:ancestor>/<int:project>',
        LeafSuggestionAPI.as_view(),
    ),
    path(
        'rest/Leaves/<int:project>',
        LeafListAPI.as_view(),
        name='Leaves',
    ),
    path(
        'rest/Leaf/<int:id>',
        LeafDetailAPI.as_view(),
    ),
    path(
        'rest/LeafCount/<int:project>',
        LeafCountAPI.as_view(),
    ),
    path(
        'rest/LeafTypes/<int:project>',
        LeafTypeListAPI.as_view(),
    ),
    path(
        'rest/LeafType/<int:id>',
        LeafTypeDetailAPI.as_view(),
    ),
    path(
        'rest/Localizations/<int:project>',
        LocalizationListAPI.as_view(),
        name='Localizations'
    ),
    path(
        'rest/Localization/<int:id>',
        LocalizationDetailAPI.as_view(),
    ),
    path(
        'rest/LocalizationCount/<int:project>',
        LocalizationCountAPI.as_view(),
    ),
    path(
        'rest/LocalizationTypes/<int:project>',
        LocalizationTypeListAPI.as_view(),
    ),
    path(
        'rest/LocalizationType/<int:id>',
        LocalizationTypeDetailAPI.as_view(),
    ),
    path('rest/LocalizationGraphic/<int:id>',
        LocalizationGraphicAPI.as_view(),
        name='LocalizationGraphic',
    ),
    path(
        'rest/Medias/<int:project>',
        MediaListAPI.as_view(),
        name='Medias'
    ),
    path(
        'rest/Media/<int:id>',
        MediaDetailAPI.as_view(),
        name='Media'
    ),
    path(
        'rest/MediaCount/<int:project>',
        MediaCountAPI.as_view(),
        name='MediaCount'
    ),
    path(
        'rest/MediaNext/<int:id>',
        MediaNextAPI.as_view(),
        name='MediaNext',
    ),
    path(
        'rest/MediaPrev/<int:id>',
        MediaPrevAPI.as_view(),
        name='MediaPrev',
    ),
    path(
        'rest/MediaStats/<int:project>',
        MediaStatsAPI.as_view(),
    ),
    path(
        'rest/MediaTypes/<int:project>',
        MediaTypeListAPI.as_view(),
    ),
    path(
        'rest/MediaType/<int:id>',
        MediaTypeDetailAPI.as_view(),
    ),
    path(
        'rest/Memberships/<int:project>',
        MembershipListAPI.as_view(),
        name='Memberships',
    ),
    path(
        'rest/Membership/<int:id>',
        MembershipDetailAPI.as_view(),
        name='Membership',
    ),
    path(
        'rest/Notify',
        NotifyAPI.as_view(),
    ),
    path(
        'rest/Organizations',
        OrganizationListAPI.as_view(),
    ),
    path(
        'rest/Organization/<int:id>',
        OrganizationDetailAPI.as_view(),
    ),
    path(
        'rest/Projects',
        ProjectListAPI.as_view(),
    ),
    path(
        'rest/Project/<int:id>',
        ProjectDetailAPI.as_view(),
    ),
    path(
        'rest/Sections/<int:project>',
        SectionListAPI.as_view(),
    ),
    path(
        'rest/Section/<int:id>',
        SectionDetailAPI.as_view(),
    ),
    path(
        'rest/SectionAnalysis/<int:project>',
        SectionAnalysisAPI.as_view(),
        name='SectionAnalysis',
    ),
    path(
        'rest/States/<int:project>',
        StateListAPI.as_view(),
        name='States'
    ),
    path(
        'rest/StateCount/<int:project>',
        StateCountAPI.as_view(),
        name='StateCount',
    ),
    path(
        'rest/StateGraphic/<int:id>',
        StateGraphicAPI.as_view(),
        name='StateGraphic'
    ),
    path(
        'rest/State/<int:id>',
        StateDetailAPI.as_view(),
    ),
    path(
        'rest/MergeStates/<int:id>',
        MergeStatesAPI.as_view(),
    ),
    path(
        'rest/TrimStateEnd/<int:id>',
        TrimStateEndAPI.as_view(),
    ),
    path(
        'rest/StateTypes/<int:project>',
        StateTypeListAPI.as_view(),
    ),
    path(
        'rest/StateType/<int:id>',
        StateTypeDetailAPI.as_view(),
    ),
    path(
        'rest/TemporaryFiles/<int:project>',
        TemporaryFileListAPI.as_view(),
    ),
    path(
        'rest/TemporaryFile/<int:id>',
        TemporaryFileDetailAPI.as_view(),
    ),
    path(
        'rest/Transcode/<int:project>',
        TranscodeAPI.as_view(),
    ),
    path(
        'rest/UploadCompletion/<int:project>',
        UploadCompletionAPI.as_view(),
    ),
    path(
        'rest/UploadInfo/<int:project>',
        UploadInfoAPI.as_view(),
    ),
    path(
        'rest/Users',
        UserListAPI.as_view(),
    ),
    path(
        'rest/User/GetCurrent',
        CurrentUserAPI.as_view(),
    ),
    path(
        'rest/User/<int:id>',
        UserDetailAPI.as_view(),
    ),
    path(
        'rest/Versions/<int:project>',
        VersionListAPI.as_view(),
        name='Versions',
    ),
    path(
        'rest/Version/<int:id>',
        VersionDetailAPI.as_view(),
        name='Version',
    ),


    # To be deprecated
    path(
        'rest/EntityTypeMedias/<int:project>',
        MediaTypeListAPI.as_view(),
    ),
    path(
        'rest/EntityTypeMedia/<int:id>',
        MediaTypeDetailAPI.as_view(),
    ),
    path(
        'rest/EntityMedia/<int:id>',
        MediaDetailAPI.as_view(),
        name='EntityMedia'
    ),
    path(
        'rest/EntityMedias/<int:project>',
        MediaListAPI.as_view(),
        name='EntityMedias'
    ),
    path(
        'rest/EntityStates/<int:project>',
        StateListAPI.as_view(),
        name='EntityStates'
    ),
    path(
        'rest/EntityState/<int:id>',
        StateDetailAPI.as_view(),
    ),
    path(
        'rest/EntityStateTypes/<int:project>',
        StateTypeListAPI.as_view(),
    ),
    path(
        'rest/EntityStateType/<int:id>',
        StateTypeDetailAPI.as_view(),
    ),
    path(
        'rest/TreeLeafTypes/<int:project>',
        LeafTypeListAPI.as_view(),
    ),
    path(
        'rest/TreeLeafType/<int:id>',
        LeafTypeDetailAPI.as_view(),
    ),
    path(
        'rest/TreeLeaves/Suggestion/<str:ancestor>/<int:project>',
        LeafSuggestionAPI.as_view(),
    ),
    path(
        'rest/TreeLeaves/<int:project>',
        LeafListAPI.as_view(),
        name='TreeLeaves',
    ),
    path(
        'rest/TreeLeaf/<int:id>',
        LeafDetailAPI.as_view(),
    ),
]
