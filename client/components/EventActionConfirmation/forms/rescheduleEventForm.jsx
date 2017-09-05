import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, formValueSelector, Field } from 'redux-form'
import * as actions from '../../../actions'
import { EventUpdateMethods, InputTextAreaField } from '../../fields/index'
import { UpdateMethodSelection } from '../UpdateMethodSelection'
import { EventScheduleForm } from '../../index'
import {
    ChainValidators,
    EndDateAfterStartDate,
    RequiredFieldsValidatorFactory,
    UntilDateValidator,
    EventMaxEndRepeatCount,
} from '../../../validators'
import { getMaxRecurrentEvents } from '../../../selectors'
import '../style.scss'

const Component = ({ handleSubmit, initialValues, relatedPlannings=[], currentSchedule, change, pristine, currentUpdateMethod }) => {
    let event = initialValues

    // Default the update_method to 'Cancel this event only'
    event.update_method = EventUpdateMethods[0]
    let showRecurring = event.recurrence_id &&
            event._recurring &&
            event._recurring.events &&
            event._recurring.events.length > 1

    const updateMethodLabel = 'Would you like to reschedule all recurring events or just this one?'
    const showRepeat = currentUpdateMethod && currentUpdateMethod.value !== EventUpdateMethods[0].value

    return (
        <div className="EventActionConfirmation Form">
            <strong>{ event.name }</strong>
            {showRecurring &&
                <div className="metadata-view">
                    <dl>
                        {showRecurring && (<dt>Events:</dt>)}
                        {showRecurring && (<dd>{event._recurring.events.length}</dd>)}
                        {showRecurring && (<dt>Plannings:</dt>)}
                        {showRecurring && (<dd>{relatedPlannings.length}</dd>)}
                    </dl>
                </div>
            }

            {<UpdateMethodSelection
                showMethodSelection={showRecurring}
                updateMethodLabel={updateMethodLabel}
                relatedPlannings={relatedPlannings}
                handleSubmit={handleSubmit}
                showSpace={false}
                action='reschedule' />}

            <EventScheduleForm
                readOnly={false}
                currentSchedule={currentSchedule}
                initialSchedule={event.dates}
                change={change}
                pristine={pristine}
                showRepeatSummary={false}
                showRepeat={showRepeat}
                showRepeatToggle={false}
            />

            <label>Reason for rescheduling {showRepeat ? 'these Events' : 'this Event'}:</label>
            <Field name="reason"
                component={InputTextAreaField}
                type="text"
                readOnly={false}/>
        </div>
    )
}

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    relatedPlannings: PropTypes.array,
    currentSchedule: PropTypes.object,
    change: PropTypes.func,
    pristine: PropTypes.bool,
    currentUpdateMethod: PropTypes.object,

    // This next one is used by the EventMaxEndRepeatCount validator
    // eslint-disable-next-line react/no-unused-prop-types
    maxRecurrentEvents: PropTypes.number,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
}

export const CancelEvent = reduxForm({
    form: 'rescheduleEvent',
    validate: ChainValidators([
        EndDateAfterStartDate,
        RequiredFieldsValidatorFactory(['dates.start', 'dates.end']),
        UntilDateValidator,
        EventMaxEndRepeatCount,
    ]),
})(Component)

const selector = formValueSelector('rescheduleEvent')
const mapStateToProps = (state) => ({
    relatedPlannings: selector(state, '_plannings'),
    currentSchedule: selector(state, 'dates'),
    currentUpdateMethod: selector(state, 'update_method'),
    maxRecurrentEvents: getMaxRecurrentEvents(state),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.events.ui.rescheduleEvent(event)),
    onHide: (event) => dispatch(actions.events.api.unlock(event)),
})

export const RescheduleEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true }
)(CancelEvent)
