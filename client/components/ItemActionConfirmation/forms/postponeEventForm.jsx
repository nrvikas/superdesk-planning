import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {gettext} from '../../../utils';
import {EVENTS} from '../../../constants';

import {EventScheduleSummary} from '../../Events';
import {Row} from '../../UI/Preview';
import {TextAreaInput} from '../../UI/Form';
import {RelatedPlannings} from '../../';

import '../style.scss';

export class PostponeEventComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {reason: ''};

        this.onReasonChange = this.onReasonChange.bind(this);
    }

    componentWillMount() {
        // Enable save so that the user can action on this event.
        this.props.enableSaveInModal();
    }

    submit() {
        const reason = this.state.reason ? (gettext('Event Postponed: ') + this.state.reason) :
            this.state.reason;

        return this.props.onSubmit(
            this.props.original,
            {reason: reason},
            get(this.props, 'modalProps.onCloseModal')
        );
    }

    onReasonChange(field, reason) {
        this.setState({reason});
    }

    render() {
        const {original, dateFormat, timeFormat, submitting} = this.props;
        let reasonLabel = gettext('Reason for Event postponement:');
        const numPlannings = original._plannings.length;

        return (
            <div className="ItemActionConfirmation">
                <Row
                    enabled={!!original.slugline}
                    label={gettext('Slugline')}
                    value={original.slugline}
                    noPadding={true}
                    className="slugline"
                />

                <Row
                    label={gettext('Name')}
                    value={original.name || ''}
                    noPadding={true}
                    className="strong"
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
                    enabled={!!numPlannings}
                    label={gettext('Planning Items')}
                    value={numPlannings}
                    noPadding={true}
                />

                {numPlannings > 0 && (
                    <div className="sd-alert sd-alert--hollow sd-alert--alert sd-alert--flex-direction">
                        <strong>{gettext('This will also postpone the following planning items')}</strong>
                        <RelatedPlannings
                            plannings={original._plannings}
                            openPlanningItem={false}
                            short={true} />
                    </div>
                )}

                <Row label={reasonLabel}>
                    <TextAreaInput
                        value={this.state.reason}
                        onChange={this.onReasonChange}
                        disabled={submitting}
                    />
                </Row>
            </div>
        );
    }
}

PostponeEventComponent.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    original: PropTypes.object.isRequired,
    relatedPlannings: PropTypes.array,
    timeFormat: PropTypes.string,
    dateFormat: PropTypes.string,
    enableSaveInModal: PropTypes.func,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
    submitting: PropTypes.bool,
    modalProps: PropTypes.object,
};

const mapStateToProps = (state) => ({
    timeFormat: selectors.config.getTimeFormat(state),
    dateFormat: selectors.config.getDateFormat(state),
});

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (original, updates, onCloseModal) => {
        const promise = dispatch(
            actions.events.ui.postponeEvent(original, updates)
        );

        if (onCloseModal) {
            promise.then(onCloseModal);
        }

        return promise;
    },

    onHide: (event, modalProps) => {
        const promise = event.lock_action === EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.lock_action ?
            dispatch(actions.events.api.unlock(event)) :
            Promise.resolve(event);

        if (get(modalProps, 'onCloseModal')) {
            promise.then((updatedEvent) => modalProps.onCloseModal(updatedEvent));
        }

        return promise;
    },
});

export const PostponeEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(PostponeEventComponent);
