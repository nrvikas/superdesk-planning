import 'angular'
import 'angular-mocks'
import 'angular-gettext'

import './'

var testsContext = require.context('.', true, /_test.jsx?$/)
testsContext.keys().forEach(testsContext)
