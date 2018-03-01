import React from 'react';
import PropTypes from 'prop-types';
import {ListItem, TimeEvent, StateLabel, Checkbox, ItemActionsMenu} from '../index';
import './style.scss';
import {GENERIC_ITEM_ACTIONS, EVENTS} from '../../constants';
import {eventUtils, itemUtils} from '../../utils';
import classNames from 'classnames';

export const EventItem = ({
    event,
    onClick,
    onDoubleClick,
    onSpikeEvent,
    onUnspikeEvent,
    onDuplicateEvent,
    onCancelEvent,
    onUpdateEventTime,
    onRescheduleEvent,
    onPostponeEvent,
    onConvertToRecurringEvent,
    highlightedEvent,
    privileges,
    isSelected,
    onSelectChange,
    lockedItems,
    className,
    session,
    addEventToCurrentAgenda,
}) => {
    const hasBeenCancelled = itemUtils.isItemCancelled(event);
    const hasBeenRescheduled = itemUtils.isItemRescheduled(event);
    const hasPlanning = eventUtils.eventHasPlanning(event);
    const onEditOrPreview = eventUtils.canEditEvent(event, session, privileges, lockedItems) ?
        onDoubleClick : onClick;
    const isItemLocked = eventUtils.isEventLocked(event, lockedItems);

    const actions = [
        {
            ...EVENTS.ITEM_ACTIONS.SPIKE,
            callback: onSpikeEvent.bind(null, event),
        },
        {
            ...EVENTS.ITEM_ACTIONS.UNSPIKE,
            callback: onUnspikeEvent.bind(null, event),
        },
        {
            ...EVENTS.ITEM_ACTIONS.DUPLICATE,
            callback: onDuplicateEvent.bind(null, event),
        },
        {
            ...EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
            callback: onCancelEvent.bind(null, event),
        },
        {
            ...EVENTS.ITEM_ACTIONS.UPDATE_TIME,
            callback: onUpdateEventTime.bind(null, event),
        },
        {
            ...EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
            callback: onRescheduleEvent.bind(null, event),
        },
        {
            ...EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
            callback: onPostponeEvent.bind(null, event),
        },
        {
            ...EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING,
            callback: onConvertToRecurringEvent.bind(null, event),
        },
        GENERIC_ITEM_ACTIONS.DIVIDER,
        {
            ...EVENTS.ITEM_ACTIONS.CREATE_PLANNING,
            callback: addEventToCurrentAgenda.bind(null, event),
        },
    ];

    const itemActions = eventUtils.getEventItemActions(
        event,
        session,
        privileges,
        actions,
        lockedItems
    );

    const canCreatePlanning = eventUtils.canCreatePlanningFromEvent(
        event,
        session,
        privileges,
        lockedItems
    );

    return (
        <ListItem
            item={event}
            onClick={onClick}
            onDoubleClick={onEditOrPreview}
            draggable={canCreatePlanning}
            className={classNames('event',
                className,
                {'event--has-planning': hasPlanning},
                {'event--has-been-canceled': hasBeenCancelled || hasBeenRescheduled},
                {'event--not-draggable': !canCreatePlanning})}
            active={highlightedEvent === event._id || isSelected}
            state={isItemLocked ? 'locked' : null}
        >
            <div className="sd-list-item__action-menu">
                <Checkbox value={isSelected} onChange={({target}) => {
                    onSelectChange(target.value);
                }}/>
            </div>
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                <div className="sd-list-item__row">
                    <StateLabel item={event}/>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow event__title">
                        {event.slugline &&
                            <span className="ListItem__slugline">{event.slugline}</span>
                        }
                        <span className="ListItem__headline">{event.name}</span>
                    </span>
                    <TimeEvent event={event}/>
                </div>
            </div>
            <div className="sd-list-item__action-menu">
                {itemActions.length > 0 && <ItemActionsMenu actions={itemActions} />}
            </div>
        </ListItem>
    );
};

EventItem.propTypes = {
    onClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func,
    event: PropTypes.object.isRequired,
    onSpikeEvent: PropTypes.func.isRequired,
    onUnspikeEvent: PropTypes.func.isRequired,
    onDuplicateEvent: PropTypes.func.isRequired,
    onCancelEvent: PropTypes.func.isRequired,
    onUpdateEventTime: PropTypes.func.isRequired,
    onRescheduleEvent: PropTypes.func.isRequired,
    onPostponeEvent: PropTypes.func.isRequired,
    onConvertToRecurringEvent: PropTypes.func.isRequired,
    highlightedEvent: PropTypes.string,
    className: PropTypes.string,
    privileges: PropTypes.object,
    isSelected: PropTypes.bool,
    onSelectChange: PropTypes.func.isRequired,
    lockedItems: PropTypes.object,
    session: PropTypes.object,
    addEventToCurrentAgenda: PropTypes.func,
};
