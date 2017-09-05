import { get, includes, isEmpty } from 'lodash'
import planning from './index'
import { getErrorMessage } from '../../utils'
import * as selectors from '../../selectors'
import { showModal, events } from '../index'
import { PLANNING, AGENDA, WORKFLOW_STATE } from '../../constants'

/**
 * WS Action when a new Planning item is created
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
const onPlanningCreated = (_e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            if (get(data, 'event_item', null) !== null) {
                dispatch(events.api.markEventHasPlannings(data.event_item))
            }

            return dispatch(self.canRefetchPlanning(data))
            .then((result) => {
                if (!result) {
                    return Promise.resolve()
                }

                return dispatch(planning.ui.refetch())
            })
        }

        return Promise.resolve()
    }
)

const canRefetchPlanning = (data) => (
    (dispatch, getState) => {
        const session = selectors.getSessionDetails(getState())

        let updatePlanning = false

        if (get(session, 'identity._id') === get(data, 'user') &&
            get(session, 'sessionId') === get(data, 'session')) {
            return Promise.resolve(updatePlanning)
        }

        const agendaId = selectors.getCurrentAgendaId(getState())
        if (agendaId === AGENDA.FILTER.ALL_PLANNING) {
            updatePlanning = true
        } else if (agendaId === AGENDA.FILTER.NO_AGENDA_ASSIGNED &&
            isEmpty(get(data, 'added_agendas', []))) {
            updatePlanning = true
        } else if (agendaId && (includes(get(data, 'added_agendas', []), agendaId) ||
            includes(get(data, 'removed_agendas', []), agendaId))) {
            updatePlanning = true
        }

        return Promise.resolve(updatePlanning)
    }
)

/**
 * WS Action when a Coverage gets created or updated
 * If the associated Planning item is not loaded,
 * silently discard this notification
 * @param {object} _e - Event object
 * @param {object} data - Coverage, Planning and User IDs
 */
const onCoverageCreatedOrUpdated = (_e, data) => (
    (dispatch, getState, { notify }) => {
        if (get(data, 'item') && get(data, 'planning')) {
            const storedPlans = selectors.getStoredPlannings(getState())

            // If we haven't got this planning loaded,
            // no need to respond to this event
            if (get(storedPlans, data.planning, null) === null) {
                return Promise.resolve()
            }

            // Otherwise send an Action to update the store
            return dispatch(planning.api.fetchCoverageById(data.item, true))
            .then(
                (item) => (Promise.resolve(item)),
                (error) => {
                    notify.error(
                        getErrorMessage(error, 'Failed to fetch the Coverage!')
                    )
                    return Promise.reject(error)
                }
            )
        }

        return Promise.resolve()
    }
)

/**
 * WS Action when a Coverage gets deleted
 * @param {object} _e - Event object
 * @param {object} data - Coverage, Planning and User IDs
 */
const onCoverageDeleted = (_e, data) => (
    (dispatch) => {
        if (get(data, 'item') && get(data, 'planning')) {
            dispatch({
                type: PLANNING.ACTIONS.COVERAGE_DELETED,
                payload: {
                    _id: data.item,
                    planning_item: data.planning,
                },
            })
        }

        return Promise.resolve()
    }
)

/**
 * WS Action when a Planning item gets updated, spiked or unspiked
 * If the Planning Item is not loaded, silently discard this notification
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
const onPlanningUpdated = (_e, data, refetch=true) => (
    (dispatch, getState, { notify }) => {
        if (get(data, 'item')) {
            if (refetch) {
                return dispatch(self.canRefetchPlanning(data))
                .then((result) => {
                    if (!result) {
                        return Promise.resolve()
                    }

                    return dispatch(planning.ui.refetch())
                })
            }

            // Otherwise send an Action to update the store
            return dispatch(planning.api.loadPlanningById(data.item, true))
            .then(
                (item) => (Promise.resolve(item)),
                (error) => {
                    notify.error(
                        getErrorMessage(error, 'Failed to get a new Planning Item!')
                    )
                    return Promise.reject(error)
                }
            )
        }

        return Promise.resolve()
    }
)

/**
 * WS Action when a Planning item gets unlocked
 * If the Planning Item is unlocked don't fetch it. Just update the store directly by a dispatch.
 * This is done because backend Eve caching is returning old objects on subsequent fetch if locking
 * is applied.
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
const onPlanningUnlocked = (_e, data) => (
    (dispatch, getState) => {
        if (get(data, 'item')) {
            let planningItem = selectors.getStoredPlannings(getState())[data.item]
            planningItem = {
                ...planningItem,
                lock_action: null,
                lock_user: null,
                lock_session: null,
                lock_time: null,
                _etag: data.etag,
            }

            // If this is the planning item currently being edited, show popup notification
            const currentPlanning = selectors.getCurrentPlanning(getState())
            if (currentPlanning && currentPlanning._id == data.item &&
                data.lock_session !== selectors.getSessionDetails(getState()).sessionId &&
                selectors.isCurrentPlanningLockedInThisSession(getState())) {
                const user =  selectors.getUsers(getState()).find((u) => u._id === data.user)
                dispatch(showModal({
                    modalType: 'NOTIFICATION_MODAL',
                    modalProps: {
                        title: 'Item Unlocked',
                        body: 'The planning item you were editing was unlocked by \"' +
                            user.display_name + '\"',
                    },
                }))
            }

            dispatch(planning.api.receivePlannings([planningItem]))
            return Promise.resolve()
        }
    }
)

const onPlanningPublished = (_e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            return dispatch(planning.ui.refetch())
        }

        return Promise.resolve()
    }
)

const onPlanningUpdateWithoutRefetch = (_e, data) => (self.onPlanningUpdated(_e, data, false))

const onPlanningSpiked = (_e, data) => (
    (dispatch, getState) => {
        let planningItem = selectors.getStoredPlannings(getState())[data.item]
        planningItem = {
            ...planningItem,
            lock_action: null,
            lock_user: null,
            lock_session: null,
            lock_time: null,
            state: WORKFLOW_STATE.SPIKED,
            revert_state: data.revert_state,
            _etag: data.etag,
        }

        dispatch(planning.api.receivePlannings([planningItem]))
        return Promise.resolve()
    }
)

const onPlanningCancelled = (e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch(planning.api.markPlanningCancelled(
                data.item,
                get(data, 'reason'),
                get(data, 'coverage_state')
            ))
        }
    }
)

const onPlanningRescheduled = (e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch(planning.api.loadPlanningById(data.item))
        }
    }
)

const self = {
    onPlanningCreated,
    onCoverageCreatedOrUpdated,
    onCoverageDeleted,
    onPlanningUpdated,
    onPlanningUnlocked,
    onPlanningPublished,
    canRefetchPlanning,
    onPlanningUpdateWithoutRefetch,
    onPlanningSpiked,
    onPlanningCancelled,
    onPlanningRescheduled,
}

// Map of notification name and Action Event to execute
self.events = {
    'planning:created': () => (self.onPlanningCreated),
    'coverage:created': () => (self.onCoverageCreatedOrUpdated),
    'coverage:updated': () => (self.onCoverageCreatedOrUpdated),
    'coverage:deleted': () => (self.onCoverageDeleted),
    'planning:updated': () => (self.onPlanningUpdated),
    'planning:spiked': () => (self.onPlanningSpiked),
    'planning:unspiked': () => (self.onPlanningUpdateWithoutRefetch),
    'planning:lock': () => (self.onPlanningUpdateWithoutRefetch),
    'planning:unlock': () => (self.onPlanningUnlocked),
    'planning:published': () => (self.onPlanningPublished),
    'planning:duplicated': () => (self.onPlanningCreated),
    'planning:cancelled': () => (self.onPlanningCancelled),
    'planning:rescheduled': () => (self.onPlanningRescheduled),
}

export default self
