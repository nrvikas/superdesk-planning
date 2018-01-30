import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {ListGroupItem} from './';
import {EVENTS, PLANNING} from '../../constants';

export class ListGroup extends React.PureComponent {
    render() {
        const {
            name,
            items,
            lockedItems,
            dateFormat,
            timeFormat,
            agendas,
            session,
            privileges,
            activeFilter,
            showRelatedPlannings,
            relatedPlanningsInList,
            onItemClick,
            onDoubleClick,
            currentWorkspace,
            onAddCoverageClick,
            onMultiSelectClick,
            selectedEventIds,
            selectedPlanningIds,
        } = this.props;

        return (
            <div className="ListGroup">
                <div className="sd-list-header">
                    <span className="sd-list-header__name">{moment(name).format('dddd LL')}</span>
                </div>
                <div className="sd-list-item-group sd-list-item-group--space-between-items">
                    {items.map((item) => {
                        const listGroupItemProps = {
                            date: name,
                            item: item,
                            onItemClick: onItemClick,
                            onDoubleClick: onDoubleClick,
                            onAddCoverageClick: onAddCoverageClick.bind(null, item),
                            lockedItems: lockedItems,
                            dateFormat: dateFormat,
                            timeFormat: timeFormat,
                            agendas: agendas,
                            session: session,
                            privileges: privileges,
                            activeFilter: activeFilter,
                            showRelatedPlannings: showRelatedPlannings,
                            relatedPlanningsInList: relatedPlanningsInList,
                            currentWorkspace: currentWorkspace,
                            onMultiSelectClick: onMultiSelectClick,
                            selectedEventIds: selectedEventIds,
                            selectedPlanningIds: selectedPlanningIds,
                            [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]:
                                this.props[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName],
                            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                                this.props[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
                            [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]:
                                this.props[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName],
                            [EVENTS.ITEM_ACTIONS.SPIKE.actionName]:
                                this.props[EVENTS.ITEM_ACTIONS.SPIKE.actionName],
                            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                                this.props[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
                            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                                this.props[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
                            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                                this.props[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
                            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                                this.props[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
                            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                                this.props[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName],
                            [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]:
                                this.props[PLANNING.ITEM_ACTIONS.DUPLICATE.actionName],
                            [PLANNING.ITEM_ACTIONS.SPIKE.actionName]:
                                this.props[PLANNING.ITEM_ACTIONS.SPIKE.actionName],
                            [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]:
                                this.props[PLANNING.ITEM_ACTIONS.UNSPIKE.actionName],
                            [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
                                this.props[PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName],
                            [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
                                this.props[PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName],
                        };

                        return <ListGroupItem key={item._id} { ...listGroupItemProps } />;
                    })}
                </div>
            </div>
        );
    }
}

ListGroup.propTypes = {
    name: PropTypes.string,
    items: PropTypes.array,
    onItemClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func,
    editItem: PropTypes.object,
    previewItem: PropTypes.object,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    agendas: PropTypes.array.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    activeFilter: PropTypes.string,
    showRelatedPlannings: PropTypes.func,
    relatedPlanningsInList: PropTypes.object,
    currentWorkspace: PropTypes.string,
    onAddCoverageClick: PropTypes.func,
    onMultiSelectClick: PropTypes.func,
    selectedEventIds: PropTypes.array,
    selectedPlanningIds: PropTypes.array,
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]: PropTypes.func,
};
