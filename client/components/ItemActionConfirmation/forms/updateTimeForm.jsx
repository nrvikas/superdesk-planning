import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import classNames from 'classnames';
import moment from 'moment';
import * as actions from '../../../actions';
import {getDateFormat, getTimeFormat} from '../../../selectors/config';
import * as selectors from '../../../selectors';
import {eventUtils, gettext, timeUtils} from '../../../utils';
import {Label, TimeInput, Row as FormRow, LineInput, Field} from '../../UI/Form/';
import {Row} from '../../UI/Preview/';
import {EventUpdateMethods, EventScheduleSummary} from '../../Events';
import '../style.scss';
import {get, set, cloneDeep, isEqual} from 'lodash';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {EVENTS, ITEM_TYPE, TIME_COMPARISON_GRANULARITY} from '../../../constants';
import {validateItem} from '../../../validators';

export class UpdateTimeComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            relatedEvents: [],
            errors: {},
            diff: {},
        };

        this.onChange = this.onChange.bind(this);
        this.getPopupContainer = this.getPopupContainer.bind(this);

        this.dom = {popupContainer: null};
    }

    componentWillMount() {
        const diff = cloneDeep(this.props.original);
        const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(this.props.original);
        const tz = get(this.props.original, 'dates.tz');
        let relatedEvents = [];

        if (isRemoteTimeZone) {
            diff.dates.start = timeUtils.getDateInRemoteTimeZone(diff.dates.start, tz);
            diff.dates.end = timeUtils.getDateInRemoteTimeZone(diff.dates.end, tz);
            diff._startTime = timeUtils.getDateInRemoteTimeZone(diff._startTime, tz);
            diff._endTime = timeUtils.getDateInRemoteTimeZone(diff._endTime, tz);
        }

        if (get(this.props, 'original.recurrence_id')) {
            const event = eventUtils.getRelatedEventsForRecurringEvent(
                this.props.original,
                EventUpdateMethods[0]
            );

            relatedEvents = event._events;
        }

        diff.update_method = EventUpdateMethods[0];

        this.setState({
            relatedEvents: relatedEvents,
            diff: diff,
        });
    }

    onChange(field, value) {
        const diff = cloneDeep(get(this.state, 'diff') || {});
        const errors = cloneDeep(this.state.errors);
        let relatedEvents = this.state.relatedEvents;
        let errorMessages = [];

        if (field === '_startTime') {
            if (value && moment.isMoment(value) && value.isValid()) {
                diff.dates.start.hour(value.hour()).minute(value.minute());
                diff._startTime = diff.dates.start.clone();
            } else {
                diff._startTime = value;
            }
        } else if (field === '_endTime') {
            if (value && moment.isMoment(value) && value.isValid()) {
                diff.dates.end.hour(value.hour()).minute(value.minute());
                diff._endTime = diff.dates.end.clone();
            } else {
                diff._endTime = value;
            }
        } else if (field === 'update_method') {
            const event = eventUtils.getRelatedEventsForRecurringEvent(
                this.props.original,
                value
            );

            relatedEvents = event._events;
            diff.update_method = value;
        } else {
            set(diff, field, value);
        }

        this.props.onValidate(
            diff,
            this.props.formProfiles,
            errors,
            errorMessages
        );

        this.setState({
            diff: diff,
            dirty: !isEqual(this.props.original, diff),
            errors: errors,
            relatedEvents: relatedEvents,
        });

        if ((eventUtils.eventsDatesSame(diff, this.props.original, TIME_COMPARISON_GRANULARITY.MINUTE) &&
                diff.update_method.value === EventUpdateMethods[0].value) ||
            !isEqual(errorMessages, [])
        ) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    submit() {
        return this.props.onSubmit(
            this.props.original,
            this.state.diff,
            get(this.props, 'modalProps') || {}
        );
    }

    getPopupContainer() {
        return this.dom.popupContainer;
    }

    render() {
        const {original, dateFormat, timeFormat, submitting} = this.props;
        const isRecurring = !!original.recurrence_id;
        const eventsInUse = this.state.relatedEvents.filter((e) => (
            get(e, 'planning_ids.length', 0) > 0 || 'pubstatus' in e
        ));
        const numEvents = this.state.relatedEvents.length + 1 - eventsInUse.length;
        const isRemoteTimeZone = timeUtils.isEventInDifferentTimeZone(original);
        const tz = get(original, 'dates.tz');
        const classes = classNames({
            'sd-line-input__time-input--max-with': !isRemoteTimeZone,
            'sd-line-input__time-input-remote--max-with': isRemoteTimeZone,
        });
        let start, end;

        start = get(this.state.diff.dates, 'start');
        end = get(this.state.diff.dates, 'end');

        if (isRemoteTimeZone) {
            start = timeUtils.getDateInRemoteTimeZone(start, tz);
            end = timeUtils.getDateInRemoteTimeZone(end, tz);
        }

        const fieldProps = {
            row: false,
            item: this.props.original,
            diff: this.state.diff,
            onChange: this.onChange,
            showErrors: true,
            errors: this.state.errors,
            readOnly: submitting,
            allowInvalidText: true,
        };

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!original.slugline}
                    label={gettext('Slugline')}
                    value={original.slugline || ''}
                    className="slugline"
                    noPadding={true}
                />

                <Row
                    label={gettext('Name')}
                    value={original.name || ''}
                    className="strong"
                    noPadding={true}
                />

                <EventScheduleSummary
                    schedule={original.dates}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    noPadding={true}
                    forUpdating={true}
                    useEventTimezone={true}
                />

                <Row
                    enabled={isRecurring}
                    label={gettext('No. of Events')}
                    value={numEvents}
                    noPadding={true}
                />

                <FormRow
                    flex={true}
                    noPadding={true}
                    invalid={!!get(this.state, 'errors._startTime')}>
                    <Label text={gettext('From')} row={true}/>
                    <Field
                        component={TimeInput}
                        field="_startTime"
                        value={start}
                        timeFormat={timeFormat}
                        noMargin={true}
                        popupContainer={this.getPopupContainer}
                        remoteTimeZone={tz}
                        isLocalTimeZoneDifferent={isRemoteTimeZone}
                        dateFormat={dateFormat}
                        className={classes}
                        {...fieldProps}
                    />
                </FormRow>

                <FormRow flex={true}>
                    <Label
                        text={gettext('To')}
                        row={true}
                        invalid={!!get(this.state, 'errors._endTime')}
                    />
                    <Field
                        component={TimeInput}
                        field="_endTime"
                        value={end}
                        timeFormat={timeFormat}
                        noMargin={true}
                        popupContainer={this.getPopupContainer}
                        remoteTimeZone={tz}
                        isLocalTimeZoneDifferent={isRemoteTimeZone}
                        dateFormat={dateFormat}
                        className={classes}
                        {...fieldProps}
                    />
                </FormRow>

                {this.state.error && <FormRow>
                    <LineInput invalid={this.state.error}
                        message="To date should be greater than From date"
                        readOnly={true} />
                </FormRow>}

                <Field
                    component={UpdateMethodSelection}
                    field="update_method"
                    showMethodSelection={isRecurring}
                    updateMethodLabel={gettext('Update all recurring events or just this one?')}
                    showSpace={false}
                    action="update time"
                    {...fieldProps}
                />

                <div ref={(node) => this.dom.popupContainer = node} />
            </div>
        );
    }
}

UpdateTimeComponent.propTypes = {
    original: PropTypes.object.isRequired,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    onValidate: PropTypes.func,
    formProfiles: PropTypes.object,
    submitting: PropTypes.bool,
    modalProps: PropTypes.object,
};

const mapStateToProps = (state) => ({
    timeFormat: getTimeFormat(state),
    dateFormat: getDateFormat(state),
    formProfiles: selectors.forms.profiles(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (original, updates, modalProps) => {
        const promise = dispatch(
            actions.events.ui.updateEventTime(original, updates)
        );

        if (get(modalProps, 'onCloseModal')) {
            promise.then((updatedEvent) => modalProps.onCloseModal(updatedEvent));
        }

        return promise;
    },
    onHide: (event, modalProps) => {
        const promise = event.lock_action === EVENTS.ITEM_ACTIONS.UPDATE_TIME.lock_action ?
            dispatch(actions.events.api.unlock(event)) :
            Promise.resolve(event);

        if (get(modalProps, 'onCloseModal')) {
            promise.then((updatedEvent) => modalProps.onCloseModal(updatedEvent));
        }

        return promise;
    },
    onValidate: (item, profile, errors, errorMessages) => dispatch(validateItem({
        profileName: ITEM_TYPE.EVENT,
        diff: item,
        formProfiles: profile,
        errors: errors,
        messages: errorMessages,
        fields: ['dates'],
    })),
});

export const UpdateTimeForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(UpdateTimeComponent);
