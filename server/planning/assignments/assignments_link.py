# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from copy import deepcopy
from superdesk import Resource, Service, get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.item import ITEM_STATE, CONTENT_STATE
from eve.utils import config
from planning.common import ASSIGNMENT_WORKFLOW_STATE, get_related_items, \
    update_assignment_on_link_unlink
from apps.archive.common import get_user, is_assigned_to_a_desk
from apps.content import push_content_notification
from superdesk.notification import push_notification
import logging
from bson.objectid import ObjectId

logger = logging.getLogger(__name__)


class AssignmentsLinkService(Service):
    def on_create(self, docs):
        for doc in docs:
            self._validate(doc)

    def create(self, docs):
        ids = []
        production = get_resource_service('archive')
        assignments_service = get_resource_service('assignments')
        assignments_complete = get_resource_service('assignments_complete')
        items = []
        deliveries = []
        published_updated_items = []

        for doc in docs:
            assignment = assignments_service.find_one(req=None, _id=doc.pop('assignment_id'))
            assignments_service.validate_assignment_action(assignment)
            item_id = doc.pop('item_id')
            actioned_item = production.find_one(req=None, _id=item_id)
            related_items = get_related_items(actioned_item)
            reassign = doc.pop('reassign')
            updates = {'assigned_to': deepcopy(assignment.get('assigned_to'))}

            for item in related_items:
                if not item.get('assignment_id'):
                    # Add a delivery for all items in published collection
                    deliveries.append({
                        'item_id': item[config.ID_FIELD],
                        'assignment_id': assignment.get(config.ID_FIELD),
                        'planning_id': assignment['planning_item'],
                        'coverage_id': assignment['coverage_item'],
                        'item_state': item.get('state'),
                        'sequence_no': item.get('rewrite_sequence', 0),
                        'publish_time': item.get('firstpublished')
                    })

                    # Update archive/published collection with assignment linking
                    update_assignment_on_link_unlink(assignment[config.ID_FIELD], item, published_updated_items)

                    ids.append(item.get(config.ID_FIELD))
                    items.append(item)

        # Create all deliveries
        if len(deliveries) > 0:
            get_resource_service('delivery').post(deliveries)

        # Update assignments, assignment history and publish planning
        # set the state to in progress if no item in the updates chain has ever been published
        already_completed = assignment['assigned_to']['state'] == ASSIGNMENT_WORKFLOW_STATE.COMPLETED
        updates['assigned_to']['state'] = ASSIGNMENT_WORKFLOW_STATE.COMPLETED if \
            actioned_item.get(ITEM_STATE) in [CONTENT_STATE.PUBLISHED, CONTENT_STATE.CORRECTED] else \
            ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS

        # on fulfiling the assignment the user is assigned the assignment, for add to planning it is not
        if reassign:
            user = get_user()
            if user and str(user.get(config.ID_FIELD)) != \
                    (assignment.get('assigned_to') or {}).get('user'):
                updates['assigned_to']['user'] = str(user.get(config.ID_FIELD))

            # if the item & assignment are'nt on the same desk, move the assignment to the item desk
            if (assignment.get('assigned_to') or {}).get('desk') != str(actioned_item.get('task').get('desk')):
                updates['assigned_to']['desk'] = str(actioned_item.get('task').get('desk'))

        # If assignment is already complete, no need to update it again
        if not already_completed:
            if actioned_item.get(ITEM_STATE) in [CONTENT_STATE.PUBLISHED, CONTENT_STATE.CORRECTED]:
                assignments_complete.update(assignment[config.ID_FIELD], updates, assignment)
            else:
                assignments_service.patch(assignment[config.ID_FIELD], updates)

        actioned_item['assignment_id'] = assignment[config.ID_FIELD]
        doc.update(actioned_item)

        # Save assignment history
        # Update assignment history with all items affected
        if len(ids) > 0:
            updates['assigned_to']['item_ids'] = ids
            assignment_history_service = get_resource_service('assignments_history')
            assignment_history_service.on_item_content_link(updates, assignment)
            if actioned_item.get(ITEM_STATE) not in [CONTENT_STATE.PUBLISHED, CONTENT_STATE.CORRECTED] or \
                    already_completed:
                # publishing planning item
                assignments_service.publish_planning(assignment['planning_item'])

        # Send notifications
        push_content_notification(items)
        push_notification(
            'content:link',
            item=str(actioned_item[config.ID_FIELD]),
            assignment=assignment[config.ID_FIELD]
        )
        return ids

    def _validate(self, doc):
        assignment = get_resource_service('assignments').find_one(
            req=None,
            _id=doc.get('assignment_id')
        )

        if not assignment:
            raise SuperdeskApiError.badRequestError('Assignment not found.')

        item = get_resource_service('archive').find_one(
            req=None,
            _id=doc.get('item_id')
        )

        if not item:
            raise SuperdeskApiError.badRequestError('Content item not found.')

        if item.get('assignment_id'):
            raise SuperdeskApiError.badRequestError(
                'Content is already linked to an assignment. Cannot link assignment and content.'
            )

        if not is_assigned_to_a_desk(item):
            raise SuperdeskApiError.badRequestError(
                'Content not in workflow. Cannot link assignment and content.'
            )

        if not item.get('rewrite_of'):
            delivery = get_resource_service('delivery').find_one(
                req=None,
                assignment_id=ObjectId(doc.get('assignment_id')))

            if delivery:
                raise SuperdeskApiError.badRequestError(
                    'Content already exists for the assignment. Cannot link assignment and content.'
                )


class AssignmentsLinkResource(Resource):
    endpoint_name = resource_title = 'assignments_link'
    url = 'assignments/link'
    schema = {
        'assignment_id': {
            'type': 'string',
            'required': True
        },
        'item_id': {
            'type': 'string',
            'required': True
        },
        'reassign': {
            'type': 'boolean',
            'required': True
        }
    }

    resource_methods = ['POST']
    item_methods = []

    privileges = {'POST': 'archive'}
