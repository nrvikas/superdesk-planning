import React, { PropTypes } from 'react'
import { DatePicker } from '../index'
import { TimePicker } from '../index'
import moment from 'moment'
import 'react-datepicker/dist/react-datepicker.css'
import './style.scss'

export class DayPickerInput extends React.Component {

    constructor(props) {
        super(props)
        const selectedDate = this.props.input.value ?
            moment(this.props.input.value) : this.props.defaultDate ?
            moment(this.props.defaultDate) : undefined
        // get the time in a different variable (different field)
        const selectedTime = selectedDate ? moment(selectedDate) : undefined
        // remove the time from the date
        if (selectedDate) selectedDate.startOf('day')

        const dateManuallyDefined = this.props.input.value ? true : false
        this.state = {
            selectedTime,
            selectedDate,
            dateManuallyDefined,
        }
    }

    /** open the date picker */
    focus() {
        this.refs.datePicker.handleFocus()
    }

    setStateFromDate(_date) {
        return new Promise((resolve) => {
            // if there is no date, reset the state
            if (!_date) {
                return this.setState({
                    selectedTime: undefined,
                    selectedDate: undefined,
                }, resolve())
            }
            // otherwise compute the value of date and time fields
            let date = moment(_date)
            // get the time in a different variable (different field)
            const selectedTime = date ? moment(date) : undefined
            // remove the time from the date
            if (date) date.startOf('day')
            this.setState({
                selectedTime,
                selectedDate: date,
            }, resolve())
        })
    }

    /** Update the state when the props change */
    componentWillReceiveProps(nextProps) {
        // use default date only when untouched
        if (!this.state.dateManuallyDefined && nextProps.defaultDate &&
            nextProps.defaultDate !== this.props.defaultDate && this.props.input.value === ''){
            this.setStateFromDate(nextProps.defaultDate)
            .then(() => this.updateValueFromState())
        } else {
            if ( moment.isMoment(nextProps.input.value) &&
                !nextProps.input.value.isSame(this.props.input.value, 'minute')) {
                this.setStateFromDate(nextProps.input.value)
                .then(() => this.updateValueFromState())
            } else if (nextProps.input.value === '') {
                this.setStateFromDate(false)
                .then(() => this.updateValueFromState())
            }
        }
    }

    onDayChange(selectedDate) {
        this.setState(
            // given date is utc, we convert to local
            {
                selectedDate: moment(selectedDate.format('YYYY-MM-DDTHH:mm:ss')),
                dateManuallyDefined: true,
            },
            () => {
                this.updateValueFromState()
            }
        )
    }

    onTimeChange(selectedTime) {
        if (selectedTime) {
            this.setState({
                selectedTime,
                dateManuallyDefined: true,
            },
                () => {
                    this.updateValueFromState()
                }
            )
        }
    }

    updateValueFromState() {
        if (this.state.selectedDate) {
            let datetime = this.state.selectedDate.clone()
            // set the time if required
            if (this.props.withTime && this.state.selectedTime) {
                datetime
                .hour(this.state.selectedTime.hours())
                .minute(this.state.selectedTime.minutes())
            }
            // updates the field value
            this.props.input.onChange(datetime ? datetime : undefined)
        }
    }

    componentDidMount() {
        // after first render, set value of the form input
        this.updateValueFromState()
    }

    render() {
        const { withTime, readOnly } = this.props
        const { touched, error, warning } = this.props.meta
        const timePickerInput = {
            value: this.state.selectedTime,
            onChange: this.onTimeChange.bind(this),
        }
        const datePickerInput = {
            value: this.state.selectedDate,
            onChange: this.onDayChange.bind(this),
        }

        return (
            <span className="day-picker-input">
                <DatePicker
                    ref="datePicker"
                    input={datePickerInput}
                    placeholder="Date"
                    readOnly={readOnly} />
                {(withTime === true) && (
                    <span>
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <TimePicker
                            input={timePickerInput}
                            placeholder="Time"
                            readOnly={readOnly} />
                    </span>
                )}
                {
                    touched && ((error && <div className="day-picker-input__error">{error}</div>) ||
                    (warning && <div className="day-picker-input__error">{warning}</div>))
                }
            </span>
        )
    }
}
DayPickerInput.propTypes = {
    withTime: PropTypes.bool,
    defaultDate: PropTypes.object,
    readOnly: PropTypes.bool,
    input: PropTypes.object,
    meta: PropTypes.object,
}
DayPickerInput.defaultProps = {
    withTime: false,
    meta: {},
}
