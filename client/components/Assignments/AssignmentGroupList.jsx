import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {ASSIGNMENTS, UI} from '../../constants';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {assignmentUtils} from '../../utils';
import {gettext} from '../../utils/gettext';

import {AssignmentItem} from './AssignmentItem';
import {Header, Group} from '../UI/List';

class AssignmentGroupListComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isNextPageLoading: false};
        this.dom = {list: null};

        this.handleScroll = this.handleScroll.bind(this);
        this.changeAssignmentListSingleGroupView = this.changeAssignmentListSingleGroupView.bind(this);
    }

    componentWillUpdate(nextProps) {
        // Bring scrolltop to top if list settings change
        if (this.props.filterBy !== nextProps.filterBy ||
            this.props.orderByField !== nextProps.orderByField ||
            this.props.orderDirection !== nextProps.orderDirection
        ) {
            if (this.dom.list.scrollTop !== 0) {
                this.dom.list.scrollTop = 0;
            }
        }
    }

    componentWillMount() {
        this.props.loadAssignmentsForGroup(this.props.groupKey);
    }

    handleScroll(event) {
        if (this.state.isNextPageLoading) {
            return;
        }

        const node = event.target;
        const {totalCount, assignments, loadMoreAssignments, groupKey} = this.props;

        if (node && totalCount > get(assignments, 'length', 0)) {
            if (node.scrollTop + node.offsetHeight + 200 >= node.scrollHeight) {
                this.setState({isNextPageLoading: true});

                loadMoreAssignments(ASSIGNMENTS.LIST_GROUPS[groupKey].states)
                    .finally(() => this.setState({isNextPageLoading: false}));
            }
        }
    }

    changeAssignmentListSingleGroupView() {
        this.props.changeAssignmentListSingleGroupView(this.props.groupKey);
    }

    getListMaxHeight() {
        if (this.props.assignmentListSingleGroupView) {
            return UI.ASSIGNMENTS.FULL_LIST_NO_OF_ITEMS *
                    UI.ASSIGNMENTS.ITEM_HEIGHT;
        } else {
            return UI.ASSIGNMENTS.DEFAULT_NO_OF_ITEMS * UI.ASSIGNMENTS.ITEM_HEIGHT;
        }
    }

    rowRenderer(index) {
        const {
            users,
            session,
            currentAssignmentId,
            privileges,
            contentTypes,
            desks,
        } = this.props;

        const assignment = this.props.assignments[index];
        const assignedUser = users.find((user) => get(assignment, 'assigned_to.user') === user._id);
        const isCurrentUser = assignedUser && assignedUser._id === session.identity._id;
        const onDoubleClick = assignmentUtils.assignmentHasContent(assignment) ?
            this.props.openArchivePreview.bind(null, assignment) :
            null;

        const assignedDesk = desks.find((desk) => get(assignment, 'assigned_to.desk') === desk._id);

        return (
            <AssignmentItem
                key={assignment._id}
                assignment={assignment}
                onClick={this.props.preview.bind(this, assignment)}
                onDoubleClick={onDoubleClick}
                assignedUser={assignedUser}
                isCurrentUser={isCurrentUser}
                lockedItems={this.props.lockedItems}
                session={session}
                privileges={privileges}
                currentAssignmentId={currentAssignmentId}
                reassign={this.props.reassign}
                completeAssignment={this.props.completeAssignment}
                editAssignmentPriority={this.props.editAssignmentPriority}
                hideItemActions={this.props.hideItemActions}
                startWorking={this.props.startWorking}
                priorities={this.props.priorities}
                removeAssignment={this.props.removeAssignment}
                revertAssignment={this.props.revertAssignment}
                contentTypes={contentTypes}
                assignedDesk={assignedDesk}
            />
        );
    }

    render() {
        const {
            assignments,
            groupKey,
            totalCount,
            assignmentListSingleGroupView,
            setMaxHeight,
        } = this.props;
        const listStyle = setMaxHeight ? {maxHeight: this.getListMaxHeight() + 'px'} : {};

        return (
            <div>
                {!assignmentListSingleGroupView && (
                    <Header>
                        <a
                            className="sd-list-header__name sd-list-header__name--cursorPointer"
                            onClick={this.changeAssignmentListSingleGroupView}
                        >
                            <span>{gettext(ASSIGNMENTS.LIST_GROUPS[groupKey].label)}</span>
                        </a>
                        <span className="sd-list-header__number badge">{totalCount}</span>
                    </Header>

                )}

                <Group
                    verticalScroll={true}
                    shadow={2}
                    style={listStyle}
                    onScroll={this.handleScroll}
                    refNode={(assignmentsList) => this.dom.list = assignmentsList}
                >
                    {get(assignments, 'length', 0) > 0 ? (
                        assignments.map((assignment, index) => this.rowRenderer(index))
                    ) : (
                        <p className="sd-list-item-group__empty-msg">{
                            gettext(
                                'There are no assignments {{ groupName }}',
                                {groupName: gettext(ASSIGNMENTS.LIST_GROUPS[groupKey].label).toLowerCase()}
                            )}
                        </p>
                    )}
                </Group>
            </div>
        );
    }
}

AssignmentGroupListComponent.propTypes = {
    filterBy: PropTypes.string,
    orderByField: PropTypes.string,
    orderDirection: PropTypes.string,
    assignments: PropTypes.array.isRequired,
    groupKey: PropTypes.string.isRequired,
    users: PropTypes.array,
    session: PropTypes.object,
    loadMoreAssignments: PropTypes.func.isRequired,
    loadAssignmentsForGroup: PropTypes.func.isRequired,
    lockedItems: PropTypes.object,
    currentAssignmentId: PropTypes.string,
    reassign: PropTypes.func,
    completeAssignment: PropTypes.func,
    editAssignmentPriority: PropTypes.func,
    hideItemActions: PropTypes.bool,
    privileges: PropTypes.object,
    startWorking: PropTypes.func,
    totalCount: PropTypes.number,
    changeAssignmentListSingleGroupView: PropTypes.func,
    assignmentListSingleGroupView: PropTypes.string,
    preview: PropTypes.func,
    priorities: PropTypes.array,
    removeAssignment: PropTypes.func,
    openArchivePreview: PropTypes.func,
    revertAssignment: PropTypes.func,
    setMaxHeight: PropTypes.bool,
    contentTypes: PropTypes.array,
    desks: PropTypes.array,
};

AssignmentGroupListComponent.defaultProps = {setMaxHeight: true};

const getAssignmentsSelectorsForListGroup = (groupKey) => {
    const groupLabel = ASSIGNMENTS.LIST_GROUPS[groupKey].label;

    switch (groupLabel) {
    case ASSIGNMENTS.LIST_GROUPS.TODO.label:
        return {
            assignmentsSelector: (state) => (selectors.getTodoAssignments(state)),
            countSelector: (state) => (selectors.getAssignmentsToDoListCount(state)),
        };

    case ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.label:
        return {
            assignmentsSelector: (state) => (selectors.getInProgressAssignments(state)),
            countSelector: (state) => (selectors.getAssignmentsInProgressListCount(state)),
        };

    default:
        return {
            assignmentsSelector: (state) => (selectors.getCompletedAssignments(state)),
            countSelector: (state) => (selectors.getAssignmentsCompletedListCount(state)),
        };
    }
};

const mapStateToProps = (state, ownProps) => {
    const assignmentDataSelector = getAssignmentsSelectorsForListGroup(ownProps.groupKey);

    return {
        filterBy: selectors.getFilterBy(state),
        orderByField: selectors.getOrderByField(state),
        orderDirection: selectors.getOrderDirection(state),
        assignments: assignmentDataSelector.assignmentsSelector(state),
        totalCount: assignmentDataSelector.countSelector(state),
        previewOpened: selectors.getPreviewAssignmentOpened(state),
        session: selectors.general.session(state),
        users: selectors.general.users(state),
        lockedItems: selectors.locks.getLockedItems(state),
        currentAssignmentId: selectors.getCurrentAssignmentId(state),
        privileges: selectors.general.privileges(state),
        assignmentListSingleGroupView: selectors.getAssignmentListSingleGroupView(state),
        priorities: selectors.getAssignmentPriorities(state),
        desks: selectors.general.desks(state),
    };
};

const mapDispatchToProps = (dispatch) => ({
    preview: (assignment) => dispatch(actions.assignments.ui.preview(assignment)),
    reassign: (assignment) => dispatch(actions.assignments.ui.reassign(assignment)),
    completeAssignment: (assignment) => dispatch(actions.assignments.ui.complete(assignment)),
    revertAssignment: (assignment) => dispatch(actions.assignments.ui.revert(assignment)),
    editAssignmentPriority: (assignment) => dispatch(actions.assignments.ui.editPriority(assignment)),
    startWorking: (assignment) => dispatch(actions.assignments.ui.openSelectTemplateModal(assignment)),
    removeAssignment: (assignment) => dispatch(actions.assignments.ui.showRemoveAssignmentModal(assignment)),
    openArchivePreview: (assignment) => dispatch(actions.assignments.ui.openArchivePreview(assignment)),
});

export const AssignmentGroupList = connect(mapStateToProps, mapDispatchToProps)(AssignmentGroupListComponent);
