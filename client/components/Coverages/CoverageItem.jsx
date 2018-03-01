import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';
import moment from 'moment-timezone';

import {Item, Column, Row, Border, ActionMenu} from '../UI/List';
import {StateLabel, InternalNoteLabel} from '../../components';

import {
    getCoverageIcon,
    itemUtils,
    getDateTimeString,
    gettext,
    stringUtils,
    planningUtils,
} from '../../utils';
import {UserAvatar} from '../UserAvatar';

export const CoverageItem = ({
    coverage,
    users,
    desks,
    dateFormat,
    timeFormat,
    contentTypes,
    itemActionComponent,
    isPreview
}) => {
    const userAssigned = itemUtils.getCreator(coverage, 'assigned_to.user', users);
    const deskAssigned = itemUtils.getItemInArrayById(desks, get(coverage, 'assigned_to.desk'));
    const coverageDate = get(coverage, 'planning.scheduled');
    const coverageDateText = !coverageDate ? 'Not scheduled yet' :
        getDateTimeString(coverageDate, dateFormat, timeFormat);
    const coverageInWorkflow = planningUtils.isCoverageInWorkflow(coverage);

    return (
        <Item noBg={true}>
            <Border/>
            {!isPreview && <Column border={false}>
                {userAssigned ? (
                    <UserAvatar
                        user={userAssigned}
                        small={false}
                    />
                ) : (
                    <UserAvatar
                        empty={true}
                        noMargin={true}
                        initials={false}
                        small={false}
                    />
                )}
            </Column>}
            <Column grow={true} border={false}>
                <Row>
                    <i className={classNames(
                        getCoverageIcon(get(coverage, 'planning.g2_content_type')),
                        {
                            'icon--green': coverageDate && moment(coverageDate).isAfter(moment()),
                            'icon--red': coverageDate && !moment(coverageDate).isAfter(moment())
                        },
                        'sd-list-item__inline-icon'
                    )}/>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {stringUtils.capitalize(get(coverage, 'planning.g2_content_type', ''))}
                    </span>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        <StateLabel item={coverageInWorkflow ? get(coverage, 'assigned_to', {}) : coverage }
                            fieldName={coverageInWorkflow ? 'state' : 'workflow_status'} />
                    </span>
                    <time>
                        <InternalNoteLabel item={coverage} prefix="planning." marginRight={true} />
                        <i className="icon-time"/>
                        {coverageDateText}
                    </time>
                </Row>
                <Row>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {!userAssigned && !deskAssigned && (
                            <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                {gettext('Unassigned')}
                            </span>
                        )}

                        {deskAssigned && (
                            <span>
                                <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                    {gettext('Desk: ')}
                                </span>
                                {get(deskAssigned, 'name')}
                            </span>
                        )}
                    </span>
                </Row>
                <Row>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {userAssigned && (
                            <span>
                                <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                    {gettext('Assignee: ')}
                                </span>
                                {get(userAssigned, 'display_name', '')}
                            </span>
                        )}
                    </span>
                </Row>
            </Column>
            {itemActionComponent && <ActionMenu>
                {itemActionComponent}
            </ActionMenu>}
        </Item>
    );
};

CoverageItem.propTypes = {
    coverage: PropTypes.object,
    users: PropTypes.array,
    desks: PropTypes.array,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    onDuplicateCoverage: PropTypes.func,
    onCancelCoverage: PropTypes.func,
    currentWorkspace: PropTypes.string,
    itemActionComponent: PropTypes.node,
    contentTypes: PropTypes.array,
    isPreview: PropTypes.bool
};

CoverageItem.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    contentTypes: [],
    isPreview: false
};
