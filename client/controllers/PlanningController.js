import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { registerNotifications } from '../utils'
import * as actions from '../actions'
import { PlanningApp } from '../components'

PlanningController.$inject = [
    '$element',
    '$scope',
    '$location',
    'sdPlanningStore',
    '$q',
]
export function PlanningController(
    $element,
    $scope,
    $location,
    sdPlanningStore,
    $q
) {
    sdPlanningStore.getStore()
    .then((store) => {
        store.dispatch(actions.initStore())
        registerNotifications($scope, store)

        $q.all({
            events: store.dispatch(actions.fetchEvents({
                fulltext: JSON.parse(
                    $location.search().searchEvent || '{}'
                ).fulltext,
            })),

            agendas: store.dispatch(actions.fetchAgendas())
            .then(() => {
                if ($location.search().agenda) {
                    return store.dispatch(actions.selectAgenda($location.search().agenda))
                }

                return Promise.resolve()
            }),

            lockedEvents: store.dispatch(
                actions.events.api.loadLockedEventsByAction('edit')
            ),

            lockedPlannings: store.dispatch(
                actions.planning.api.loadLockedPlanningsByAction('edit')
            ),
        })
        .then(() => {
            $scope.$on('$destroy', () => {
                // Unmount the React application
                ReactDOM.unmountComponentAtNode($element.get(0))
                store.dispatch(actions.resetStore())
            })

            // render the planning application
            ReactDOM.render(
                <Provider store={store}>
                    <PlanningApp />
                </Provider>,
                $element.get(0)
            )
        })
    })
}
