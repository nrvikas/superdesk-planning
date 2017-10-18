import { ASSIGNMENTS } from '../constants'
import { get } from 'lodash'

const isAssignmentCancelled = (assignment) =>
    (get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.CANCELLED)

const canCompleteAssignment = (assignment) =>
    (get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS)

const canEditAssignment = (assignment) =>
    (!isAssignmentCancelled(assignment) &&
        get(assignment, 'assigned_to.state') !== ASSIGNMENTS.WORKFLOW_STATE.COMPLETED)

const self = {
    isAssignmentCancelled,
    canCompleteAssignment,
    canEditAssignment,
}

export default self
