import moment from 'moment-timezone';
import {get, set, map, cloneDeep} from 'lodash';
import {
    PUBLISHED_STATE,
    WORKFLOW_STATE,
    TOOLTIPS,
    ASSIGNMENTS,
    ITEM_TYPE,
    GENERIC_ITEM_ACTIONS,
    PLANNING,
    WORKSPACE,
} from '../constants/index';

const getItemInArrayById = (items, id, field = '_id') => (
    id ? items.find((item) => get(item, field) === id) : null
);

const isSameItemId = (item1, item2) => get(item1, '_id') === get(item2, '_id');
const getItemWorkflowState = (item, field = 'state') => (get(item, field, WORKFLOW_STATE.DRAFT));
const isItemCancelled = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.CANCELLED;
const isItemRescheduled = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.RESCHEDULED;
const isItemKilled = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.KILLED;
const isItemPostponed = (item) => getItemWorkflowState(item) === WORKFLOW_STATE.POSTPONED;
const getItemActionedStateLabel = (item) => {
    // Currently will cater for 'rescheduled from' scenario.
    // If we need to use this for 'dpulicate from' or any other, we can extend it

    if (item.reschedule_from) {
        return {
            label: gettext('Rescheduled From'),
            iconType: 'highlight2',
        };
    }
};

// eslint-disable-next-line complexity
const getItemWorkflowStateLabel = (item, field = 'state') => {
    switch (getItemWorkflowState(item, field)) {
    case WORKFLOW_STATE.DRAFT:
        return {
            label: gettext('draft'),
            iconHollow: true,
        };
    case WORKFLOW_STATE.SPIKED:
        return {
            label: gettext('spiked'),
            iconType: 'alert',
        };
    case WORKFLOW_STATE.INGESTED:
        return {
            label: gettext('ingested'),
            iconHollow: true,
        };
    case WORKFLOW_STATE.SCHEDULED:
        return {
            label: gettext('Scheduled'),
            labelVerbose: 'Scheduled',
            iconType: 'success',
            tooltip: TOOLTIPS.scheduledState,
        };
    case WORKFLOW_STATE.KILLED:
        return {
            label: gettext('Killed'),
            iconType: 'warning',
            tooltip: TOOLTIPS.withheldState,
        };
    case WORKFLOW_STATE.RESCHEDULED:
        return {
            label: gettext('Rescheduled'),
            iconType: 'highlight2',
        };
    case WORKFLOW_STATE.CANCELLED:
        return {
            label: gettext('Cancelled'),
            iconType: 'yellow2',
        };
    case WORKFLOW_STATE.POSTPONED:
        return {
            label: gettext('Postponed'),
            iconType: 'yellow2',

        };
    case ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED:
        return {
            label: gettext('Assigned'),
            iconHollow: true,
        };
    case ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS:
        return {
            label: gettext('In Progress'),
            iconType: 'yellow2',
            iconHollow: true,
        };
    case ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED:
        return {
            label: gettext('Submitted'),
            iconType: 'yellow2',
            iconHollow: true,
        };
    case ASSIGNMENTS.WORKFLOW_STATE.COMPLETED:
        return {
            label: gettext('Completed'),
            iconType: 'success',
        };
    }
};

const getItemPublishedStateLabel = (item) => {
    switch (getPublishedState(item)) {
    case PUBLISHED_STATE.USABLE:
        return {
            label: 'P',
            labelVerbose: gettext('Published'),
            iconType: 'success',
            tooltip: TOOLTIPS.publishedState,
        };

    case PUBLISHED_STATE.CANCELLED:
        return {
            label: gettext('Cancelled'),
            iconType: 'yellow2',
        };
    }
};

const isItemPublic = (item = {}) =>
    !!item && (typeof item === 'string' ?
        item === PUBLISHED_STATE.USABLE || item === PUBLISHED_STATE.CANCELLED :
        item.pubstatus === PUBLISHED_STATE.USABLE || item.pubstatus === PUBLISHED_STATE.CANCELLED);

const isItemSpiked = (item) => item ?
    getItemWorkflowState(item) === WORKFLOW_STATE.SPIKED : false;

const shouldLockItemForEdit = (item, lockedItems) =>
    get(item, '_id') && !lockUtils.getLock(item, lockedItems) && !isItemSpiked(item);

const isLockedForAddToPlanning = (item) => get(item, 'lock_action') ===
    PLANNING.ITEM_ACTIONS.ADD_TO_PLANNING.lock_action;

const shouldUnLockItem = (item, session, currentWorkspace) =>
    (currentWorkspace === WORKSPACE.AUTHORING && isLockedForAddToPlanning(item)) ||
    (currentWorkspace !== WORKSPACE.AUTHORING && lockUtils.isItemLockedInThisSession(item, session));


const getItemsById = (ids, items) => (
    ids.map((id) => (items[id]))
);

const getItemType = (item) => {
    const itemType = get(item, '_type');

    if (itemType === ITEM_TYPE.EVENT) {
        return ITEM_TYPE.EVENT;
    } else if (itemType === ITEM_TYPE.PLANNING) {
        return ITEM_TYPE.PLANNING;
    } else if (itemType === ITEM_TYPE.ASSIGNMENT) {
        return ITEM_TYPE.ASSIGNMENT;
    } else if (itemType === ITEM_TYPE.ARCHIVE) {
        return ITEM_TYPE.ARCHIVE;
    }

    return ITEM_TYPE.UNKNOWN;
};

/**
 * Helper function to retrieve the user object using their ID from an item field.
 * i.e. get the User object for 'original_creator'
 * @param {object} item - The item to get the ID from
 * @param {string} creator - The field name where the ID is stored
 * @param {Array} users - The array of users, typically from the redux store
 * @return {object} The user object found, otherwise nothing is returned
 */
const getCreator = (item, creator, users) => {
    const user = get(item, creator);

    if (user) {
        return user.display_name ? user : users.find((u) => u._id === user);
    }
};

const getPublishedState = (item) => get(item, 'pubstatus', null);

// eslint-disable-next-line consistent-this
const self = {
    getItemInArrayById,
    isSameItemId,
    getItemWorkflowState,
    isItemCancelled,
    isItemRescheduled,
    isItemKilled,
    isItemPostponed,
    getItemActionedStateLabel,
    getItemWorkflowStateLabel,
    getItemPublishedStateLabel,
    isItemPublic,
    isItemSpiked,
    shouldLockItemForEdit,
    shouldUnLockItem,
    getItemsById,
    getItemType,
    getCreator,
    getPublishedState,
    isLockedForAddToPlanning,
};

export default self;

