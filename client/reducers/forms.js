import { reducer as formReducer, actionTypes } from 'redux-form'
import { cloneDeep, get } from 'lodash'
import { EventUpdateMethods } from '../components/fields'
import moment from 'moment'
import { RESET_STORE, INIT_STORE } from '../constants'
import { eventUtils, isItemSpiked } from '../utils/index'

const forms = formReducer.plugin({
    // 'addEvent' is the name of the form given to reduxForm()
    addEvent: (state={}, action) => {
        if (action.type === RESET_STORE) {
            return null
        } else if (action.type === INIT_STORE) {
            return {}
        } else if (action.type !== actionTypes.CHANGE ||
            get(action, 'meta.form', '') !== 'addEvent') {
            return state
        }

        // if count or until is set, reset the other field
        if (action.payload) {
            let newState = cloneDeep(state)
            if (action.meta.field === 'dates.recurring_rule.count') {
                newState.values.dates.recurring_rule.until = undefined
                return newState
            } else if (action.meta.field === 'dates.recurring_rule.until') {
                newState.values.dates.recurring_rule.count = undefined
                return newState
            }
        }

        return state
    },

    // 'spikeEvent' is the name of the form given to reduxForm
    spikeEvent: (state={}, action) => {
        if (action.type === RESET_STORE) {
            return null
        } else if (action.type === INIT_STORE) {
            return {}
        } else if (action.type !== actionTypes.CHANGE ||
            get(action, 'meta.form', '') !== 'spikeEvent') {
            return state
        }

        let event = state.values
        let events = event._recurring.events
        let storedPlannings = event._recurring.plannings
        let plannings = []

        if (action.payload && action.meta.field === 'update_method') {
            // Filter planning items based on the current 'update_method'
            // Spike selected event only
            if (action.payload.value === EventUpdateMethods[0].value) {
                plannings = Object.keys(storedPlannings).filter((pid) => (
                    storedPlannings[pid].event_item === event._id &&
                    !isItemSpiked(storedPlannings[pid])
                )).map((pid) => ({ ...storedPlannings[pid] }))

            // Spike selected and future events
            } else if (action.payload.value === EventUpdateMethods[1].value) {
                let ids = events.filter((e) => (
                    moment(e.dates.start).isSameOrAfter(moment(event.dates.start))
                )).map((e) => (e._id)) || []
                plannings = Object.keys(storedPlannings).filter((pid) => (
                    (ids || []).indexOf(storedPlannings[pid].event_item) > -1 &&
                    !isItemSpiked(storedPlannings[pid])
                )).map((pid) => ({ ...storedPlannings[pid] }))

            // Spike all events
            } else if (action.payload.value === EventUpdateMethods[2].value) {
                plannings = Object.keys(storedPlannings).filter((pid) => (
                    (event._recurring.ids || []).indexOf(storedPlannings[pid].event_item) > -1 &&
                    !isItemSpiked(storedPlannings[pid])
                )).map((pid) => ({ ...storedPlannings[pid] }))
            }
        }

        return {
            ...state,
            values: {
                ...state.values,
                _plannings: plannings,
            },
        }
    },
    // 'updateEventConfirmation' is the name of the form given to reduxForm
    updateEventConfirmation: (state, action) =>
        (eventUtils.getRelatedEventsForRecurringEvent(state, action)),
    updateTime: (state, action) => (eventUtils.getRelatedEventsForRecurringEvent(state, action)),

    // 'planningAdvancedSearch' is the name of the form given to reduxForm
    planningAdvancedSearch: (state={}, action) => {
        if (action.type !== actionTypes.CHANGE ||
            get(action, 'meta.form', '') !== 'planningAdvancedSearch') {
            return state
        }

        let values = state.values
        if (get(action, 'meta.field', '') === 'dates.range' && get(values, 'dates.range') !== '') {
            return {
                ...state,
                values: {
                    ...values,
                    dates: { range: get(values, 'dates.range') },
                },
            }
        } else if ((get(action, 'meta.field', '') === 'dates.start' &&
                moment.isMoment(get(values, 'dates.start'))) ||
            (get(action, 'meta.field', '') === 'dates.end'  &&
                moment.isMoment(get(values, 'dates.end')))) {
            return {
                ...state,
                values: {
                    ...values,
                    dates: {
                        start: get(values, 'dates.start', null),
                        end: get(values, 'dates.end', null),
                    },
                },
            }
        } else {
            return { ...state }
        }
    },
})

export default forms
