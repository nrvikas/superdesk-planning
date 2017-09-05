import eventsApi from '../api'
import eventsUi from '../ui'
import planningApi from '../../planning/api'
import { PRIVILEGES } from '../../../constants'
import sinon from 'sinon'
import { getTestActionStore, restoreSinonStub, expectAccessDenied } from '../../../utils/testUtils'

describe('actions.events.ui', () => {
    let errorMessage
    let store
    let services
    let data

    beforeEach(() => {
        errorMessage = { data: { _message: 'Failed!' } }
        store = getTestActionStore()
        services = store.services
        data = store.data

        sinon.stub(eventsApi, 'loadEventsByRecurrenceId').callsFake(
            () => (Promise.resolve(data.events))
        )

        sinon.stub(eventsApi, 'loadRecurringEventsAndPlanningItems').callsFake(
            () => (Promise.resolve(data.events[0]))
        )

        sinon.stub(eventsApi, 'spike').callsFake(
            () => (Promise.resolve(data.events))
        )

        sinon.stub(eventsApi, 'unspike').callsFake(
            () => (Promise.resolve(data.events))
        )

        sinon.stub(eventsApi, 'refetchEvents').callsFake(() => (Promise.resolve()))

        sinon.stub(eventsUi, '_openSpikeModal').callsFake(
            () => (Promise.resolve())
        )

        sinon.stub(eventsUi, '_openSingleSpikeModal').callsFake(
            () => (Promise.resolve())
        )

        sinon.stub(eventsUi, '_openMultiSpikeModal').callsFake(
            () => (Promise.resolve())
        )

        sinon.stub(eventsUi, 'refetchEvents').callsFake(() => (Promise.resolve()))

        sinon.stub(planningApi, 'loadPlanningByEventId').callsFake(
            () => (Promise.resolve(data.plannings))
        )

        sinon.stub(planningApi, 'fetch').callsFake(() => (Promise.resolve([])))

        sinon.stub(eventsUi, 'setEventsList').callsFake(() => (Promise.resolve()))

        sinon.stub(eventsUi, '_openEventDetails').callsFake(() => (Promise.resolve()))
        sinon.stub(eventsApi, 'lock').callsFake((item) => (Promise.resolve(item)))
        sinon.stub(eventsApi, 'unlock').callsFake((item) => (Promise.resolve(item)))

        sinon.stub(eventsApi, 'rescheduleEvent').callsFake(() => (Promise.resolve()))
    })

    afterEach(() => {
        restoreSinonStub(eventsApi.fetch)
        restoreSinonStub(eventsApi.spike)
        restoreSinonStub(eventsApi.unspike)
        restoreSinonStub(eventsApi.loadEventsByRecurrenceId)
        restoreSinonStub(eventsApi.loadRecurringEventsAndPlanningItems)
        restoreSinonStub(eventsApi.refetchEvents)
        restoreSinonStub(eventsUi._openSpikeModal)
        restoreSinonStub(eventsUi._openSingleSpikeModal)
        restoreSinonStub(eventsUi._openMultiSpikeModal)
        restoreSinonStub(eventsUi.refetchEvents)
        restoreSinonStub(eventsUi.setEventsList)
        restoreSinonStub(eventsUi._openEventDetails)
        restoreSinonStub(eventsApi.lock)
        restoreSinonStub(eventsApi.unlock)
        restoreSinonStub(eventsApi.rescheduleEvent)
        restoreSinonStub(planningApi.loadPlanningByEventId)
        restoreSinonStub(planningApi.fetch)
    })

    describe('openSpikeModal', () => {
        beforeEach(() => {
            restoreSinonStub(eventsUi._openSpikeModal)
        })

        it('calls _openSingleSpikeModal', () => {
            const action = eventsUi._openSpikeModal(data.events[1])
            action(store.dispatch)

            // Opens the Single Spike modal
            expect(eventsUi._openSingleSpikeModal.callCount).toBe(1)
            expect(eventsUi._openSingleSpikeModal.args[0]).toEqual([data.events[1]])

            // Doesn't open the Multi Spike modal
            expect(eventsUi._openMultiSpikeModal.callCount).toBe(0)
        })

        it('calls _openMultiSpikeModal', () => {
            data.events[1].recurrence_id = 'rec1'
            const action = eventsUi._openSpikeModal(data.events[1])
            action(store.dispatch)

            // Doesn't open the Single Spike modal
            expect(eventsUi._openSingleSpikeModal.callCount).toBe(0)

            // Opens the Multi Spike modal
            expect(eventsUi._openMultiSpikeModal.callCount).toBe(1)
            expect(eventsUi._openMultiSpikeModal.args[0]).toEqual([data.events[1]])
        })

        it('openSpikeModal raises ACCESS_DENIED without permission', (done) => {
            store.initialState.privileges.planning_event_spike = 0
            return store.test(done, eventsUi.openSpikeModal(data.events[1]))
            .catch(() => {
                expectAccessDenied({
                    store,
                    permission: PRIVILEGES.SPIKE_EVENT,
                    action: '_openSpikeModal',
                    errorMessage: 'Unauthorised to spike an Event',
                    args: [data.events[1]],
                })

                done()
            })
        })
    })

    describe('_openSingleSpikeModal', () => {
        beforeEach(() => {
            restoreSinonStub(eventsUi._openSingleSpikeModal)
        })

        it('loads planning items and shows the modal', (done) => (
            store.test(done, eventsUi._openSingleSpikeModal(data.events[1]))
            .then(() => {
                expect(planningApi.loadPlanningByEventId.callCount).toBe(1)
                expect(planningApi.loadPlanningByEventId.args[0]).toEqual([data.events[1]._id])

                expect(store.dispatch.callCount).toBe(2)
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'SHOW_MODAL',
                    modalType: 'ITEM_ACTIONS_MODAL',
                    modalProps: {
                        eventDetail: {
                            ...data.events[1],
                            _plannings: data.plannings,
                        },
                        actionType: 'Spike',
                    },
                }])

                expect(services.notify.error.callCount).toBe(0)

                done()
            })
        ))

        it('notifies user upon loadPlanningByEventId error', (done) => {
            restoreSinonStub(planningApi.loadPlanningByEventId)
            sinon.stub(planningApi, 'loadPlanningByEventId').callsFake(
                () => (Promise.reject(errorMessage))
            )
            return store.test(done, eventsUi._openSingleSpikeModal(data.events[1]))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)

                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])

                done()
            })
        })
    })

    describe('_openMultiSpikeModal', () => {
        beforeEach(() => {
            restoreSinonStub(eventsUi._openMultiSpikeModal)
            data.events[0].recurrence_id = 'rec1'
        })

        it('loads events/planning items and shows the modal', (done) => (
            store.test(done, eventsUi._openMultiSpikeModal(data.events[0]))
            .then(() => {
                expect(eventsApi.loadRecurringEventsAndPlanningItems.callCount).toBe(1)
                expect(eventsApi.loadRecurringEventsAndPlanningItems.args[0])
                    .toEqual([data.events[0]])

                expect(store.dispatch.callCount).toBe(2)
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'SHOW_MODAL',
                    modalType: 'ITEM_ACTIONS_MODAL',
                    modalProps: {
                        eventDetail: data.events[0],
                        actionType: 'Spike',
                    },
                }])

                done()
            })
        ))

        it('notifies user if failed to load associated items', (done) => {
            restoreSinonStub(eventsApi.loadRecurringEventsAndPlanningItems)
            sinon.stub(eventsApi, 'loadRecurringEventsAndPlanningItems').callsFake(
                () => (Promise.reject(errorMessage))
            )

            return store.test(done, eventsUi._openMultiSpikeModal(data.events[0]))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)

                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])

                done()
            })
        })
    })

    describe('openBulkSpikeModal', () => {
        it('shows the spike modal', (done) => (
            store.test(done, eventsUi.openBulkSpikeModal(data.events))
            .then(() => {
                expect(store.dispatch.callCount).toBe(2)
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'SHOW_MODAL',
                    modalType: 'CONFIRMATION',
                    modalProps: jasmine.objectContaining(
                        { body: 'Do you want to spike these 3 events?' }
                    ),
                }])

                done()
            })
        ))

        it('openBulkSpikeModal raises ACCESS_DENIED without permission', (done) => {
            store.initialState.privileges.planning_event_spike = 0
            return store.test(done, eventsUi.openBulkSpikeModal(data.events))
            .catch(() => {
                expectAccessDenied({
                    store,
                    permission: PRIVILEGES.SPIKE_EVENT,
                    action: '_openBulkSpikeModal',
                    errorMessage: 'Unauthorised to spike an Event',
                    args: [data.events],
                })

                done()
            })
        })
    })

    describe('openUnspikeModal', () => {
        it('shows the unspike modal', (done) => (
            store.test(done, eventsUi.openUnspikeModal(data.events))
            .then(() => {
                expect(store.dispatch.callCount).toBe(2)
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'SHOW_MODAL',
                    modalType: 'CONFIRMATION',
                    modalProps: jasmine.objectContaining(
                        { body: 'Do you want to unspike these 3 events?' }
                    ),
                }])

                done()
            })
        ))

        it('openUnspikeModal raises ACCESS_DENIED without permission', (done) => {
            store.initialState.privileges.planning_event_unspike = 0
            return store.test(done, eventsUi.openUnspikeModal(data.events))
            .catch(() => {
                expectAccessDenied({
                    store,
                    permission: PRIVILEGES.UNSPIKE_EVENT,
                    action: '_openUnspikeModal',
                    errorMessage: 'Unauthorised to unspike an Event',
                    args: [data.events],
                })

                done()
            })
        })
    })

    describe('spike', () => {
        it('calls `api.spike`', (done) => (
            store.test(done, eventsUi.spike(data.events[0]))
            .then((items) => {
                expect(items).toEqual(data.events)

                expect(eventsApi.spike.callCount).toBe(1)
                expect(eventsApi.spike.args[0]).toEqual([data.events[0]])

                expect(services.notify.success.callCount).toBe(1)
                expect(services.notify.success.args[0]).toEqual(['The event(s) have been spiked'])

                expect(services.notify.error.callCount).toBe(0)

                done()
            })
        ))

        it('notifies user if `api.spike` fails', (done) => {
            restoreSinonStub(eventsApi.spike)
            sinon.stub(eventsApi, 'spike').callsFake(() => (Promise.reject(errorMessage)))

            return store.test(done, eventsUi.spike(data.events[0]))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)

                expect(services.notify.success.callCount).toBe(0)

                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])

                done()
            })
        })
    })

    describe('unspike', () => {
        it('calls `api.unspike`', (done) => (
            store.test(done, eventsUi.unspike(data.events[0]))
            .then((items) => {
                expect(items).toEqual(data.events)

                expect(eventsApi.unspike.callCount).toBe(1)
                expect(eventsApi.unspike.args[0]).toEqual([data.events[0]])

                expect(eventsUi.refetchEvents.callCount).toBe(1)

                expect(services.notify.success.callCount).toBe(1)
                expect(services.notify.success.args[0]).toEqual(['The event(s) have been unspiked'])

                expect(services.notify.error.callCount).toBe(0)

                done()
            })
        ))

        it('notifies user if `api.unspike` fails', (done) => {
            restoreSinonStub(eventsApi.unspike)
            sinon.stub(eventsApi, 'unspike').callsFake(() => (Promise.reject(errorMessage)))

            return store.test(done, eventsUi.unspike(data.events[0]))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)

                expect(services.notify.success.callCount).toBe(0)

                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])

                done()
            })
        })
    })

    it('setEventsList', () => {
        restoreSinonStub(eventsUi.setEventsList)
        expect(eventsUi.setEventsList(['e1', 'e2'])).toEqual({
            type: 'SET_EVENTS_LIST',
            payload: ['e1', 'e2'],
        })
    })

    describe('refetchEvents', () => {
        it('updates list', (done) => {
            restoreSinonStub(eventsApi.refetchEvents)
            restoreSinonStub(eventsUi.refetchEvents)

            sinon.stub(eventsApi, 'refetchEvents').callsFake(
                () => (Promise.resolve(data.events))
            )

            return store.test(done, eventsUi.refetchEvents())
            .then((events) => {
                expect(events).toEqual(data.events)

                expect(eventsApi.refetchEvents.callCount).toBe(1)

                expect(eventsUi.setEventsList.callCount).toBe(1)
                expect(eventsUi.setEventsList.args[0]).toEqual([['e1', 'e2', 'e3']])

                done()
            })
        })

        it('notifies user if api.refetchEvents fails', (done) => {
            restoreSinonStub(eventsApi.refetchEvents)
            restoreSinonStub(eventsUi.refetchEvents)

            sinon.stub(eventsApi, 'refetchEvents').callsFake(
                () => (Promise.reject(errorMessage))
            )

            return store.test(done, eventsUi.refetchEvents())
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)

                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])

                done()
            })
        })
    })

    describe('openEventDetails', () => {
        it('openEventDetails dispatches action', (done) => {
            store.test(done, eventsUi.openEventDetails())
            .then(() => {
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'OPEN_EVENT_DETAILS',
                    payload: true,
                }])
                done()
            })
        })

        it('openEventDetails calls `lockEvent` api', (done) => {
            store.test(done, eventsUi.openEventDetails(data.events[0]))
            .then(() => {
                expect(eventsApi.lock.callCount).toBe(1)
                done()
            })
        })

        it('openEventDetails dispatches previewEvent if insufficient privileges', (done) => {
            store.initialState.privileges.planning_event_management = 0
            store.test(done, eventsUi.openEventDetails(data.events[0]))
            .catch(() => {
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'PREVIEW_EVENT',
                    payload: data.events[0]._id,
                }])

                expectAccessDenied({
                    store,
                    permission: PRIVILEGES.EVENT_MANAGEMENT,
                    action: '_openEventDetails',
                    errorMessage: 'Unauthorised to edit an event!',
                    args: [data.events[0]],
                    argPos: 2,
                })

                done()
            })
        })
    })

    it('closeEventDetails', (done) => {
        store.test(done, eventsUi.closeEventDetails())
            .then(() => {
                expect(store.dispatch.args[0]).toEqual([{ type: 'CLOSE_EVENT_DETAILS' }])
                done()
            })
    })

    it('_previewEvent', () => {
        expect(eventsUi._previewEvent(data.events[0])).toEqual({
            type: 'PREVIEW_EVENT',
            payload: data.events[0]._id,
        })
    })

    it('minimizeEventDetails', () => {
        expect(eventsUi.minimizeEventDetails()).toEqual({ type: 'CLOSE_EVENT_DETAILS' })
    })

    it('unlockAndCloseEditor', (done) => {
        store.initialState.events.highlightedEvent = 'e1'
        data.events[0].lock_user = store.initialState.session.identity._id
        data.events[0].lock_session = store.initialState.session.sessionId

        store.test(done, eventsUi.unlockAndCloseEditor(data.events[0]))
            .then(() => {
                expect(eventsApi.unlock.callCount).toBe(1)
                expect(store.dispatch.callCount).toBe(2)
                expect(store.dispatch.args[1]).toEqual([{ type: 'CLOSE_EVENT_DETAILS' }])
                expect(services.notify.error.callCount).toBe(0)
                done()
            })
    })

    describe('_openRescheduleModal', () => {
        it('loads planning items and shows single reschedule modal', (done) => (
            store.test(done, eventsUi._openSingleRescheduleModal(data.events[1]))
            .then(() => {
                expect(planningApi.loadPlanningByEventId.callCount).toBe(1)
                expect(planningApi.loadPlanningByEventId.args[0]).toEqual([data.events[1]._id])

                expect(store.dispatch.callCount).toBe(2)
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'SHOW_MODAL',
                    modalType: 'ITEM_ACTIONS_MODAL',
                    modalProps: {
                        eventDetail: {
                            ...data.events[1],
                            _plannings: data.plannings,
                        },
                        actionType: 'Reschedule',
                    },
                }])

                expect(services.notify.error.callCount).toBe(0)

                done()
            })
        ))

        it('loads planning items and shows recurring reschedule modal', (done) => {
            data.events[0].recurrence_id = 'rec1'
            store.test(done, eventsUi._openMultiRescheduleModal(data.events[0]))
            .then(() => {
                expect(eventsApi.loadRecurringEventsAndPlanningItems.callCount).toBe(1)
                expect(eventsApi.loadRecurringEventsAndPlanningItems.args[0])
                    .toEqual([data.events[0]])

                expect(store.dispatch.callCount).toBe(2)
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'SHOW_MODAL',
                    modalType: 'ITEM_ACTIONS_MODAL',
                    modalProps: {
                        eventDetail: data.events[0],
                        actionType: 'Reschedule',
                    },
                }])

                expect(services.notify.error.callCount).toBe(0)

                done()
            })
        })
    })
})
