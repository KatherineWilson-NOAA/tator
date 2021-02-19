membership_properties = {
    'user': {
        'description': 'Unique integer identifying a user.',
        'type': 'integer',
        'minimum': 1,
    },
    'permission': {
        'description': 'User permission level for the project.',
        'type': 'string',
        'enum': ['View Only', 'Can Edit', 'Can Transfer', 'Can Execute', 'Full Control'],
    },
    'default_version': {
        'description': 'Unique integer identifying a version.',
        'type': 'integer',
        'minimum': 1,
    },
}

membership_spec = {
    'type': 'object',
    'required': ['user', 'permission'],
    'properties': membership_properties,
}

membership_update = {
    'type': 'object',
    'properties': {
        'permission': membership_properties['permission'],
        'default_version': membership_properties['default_version'],
    },
}

membership = {
    'type': 'object',
    'description': 'Membership object.',
    'properties': {
        'id': {
            'type': 'integer',
            'description': 'Unique integer identifying a membership.',
        },
        'user': membership_properties['user'],
        'username': {
            'description': 'Username for the membership.',
            'type': 'string',
        },
        'permission': membership_properties['permission'],
        'default_version': membership_properties['default_version'],
    },
}

