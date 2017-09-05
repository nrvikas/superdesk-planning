import React, { PropTypes } from 'react'
import moment from 'moment'
import { DatePickerCore } from './DatePickerCore'
import './styles.scss'

export class DatePicker extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            openDatePicker: false,
            invalid: false,
            viewValue: '',
            previousValidValue: '',
        }
    }

    componentWillReceiveProps(nextProps) {
        const val = nextProps.input.value && moment.isMoment(nextProps.input.value) ?
            nextProps.input.value.format('DD/MM/YYYY') : ''
        this.setState({
            viewValue: val,
            previousValidValue: val,
        })
    }

    componentDidMount() {
        // after first render, set value of the form input
        const { value } = this.props.input
        const viewValue = value && moment.isMoment(value) ? value.format('DD/MM/YYYY') : ''
        this.setState({ viewValue })
    }

    toggleOpenDatePicker() {
        this.setState({ openDatePicker: !this.state.openDatePicker })
    }

    handleFocus() {
        this.toggleOpenDatePicker()
    }

    validateTimeText(val) {
        let regex = new RegExp('[0-9][0-9]\/[0-9][0-9]\/[0-9][0-9][0-9][0-9]', 'i')
        if (val.match(regex) && moment(val, 'DD/MM/YYYY').isValid()) {
            this.setState({
                invalid: false,
                viewValue: val,
                previousValidValue: val,
            })
            this.onChange(val)
        } else {
            this.setState({
                invalid: true,
                viewValue: val,
            })
        }
    }

    handleInputBlur() {
        if (this.state.invalid) {
            this.setState({
                viewValue: this.state.previousValidValue,
                invalid: false,
            })
        }
    }

    onChange(value) {
        if (value.isValid() && (!value.isSame(this.props.input.value)) || !this.props.input.value) {
            // Set the time to 00:00 as per requirement
            this.props.input.onChange(value.clone().hour(0).minute(0))
        }
    }

    render() {
        const { placeholder, readOnly, className } = this.props
        return (
            <div className={'datepickerInput' + (className ? ` ${className}` : '')}>
                <input type="text" className={ 'datepickerInput__textInput inputField' + (this.state.invalid ? ' datepickerInput__textInput--invalid' : '')} disabled={readOnly ? 'disabled' : ''} value={this.state.viewValue} placeholder={placeholder} onChange={(e)=>(this.validateTimeText(e.target.value))}
                onBlur={this.handleInputBlur.bind(this)} />
                <button className="datepickerInput--btn" type="button" onClick={!readOnly && this.toggleOpenDatePicker.bind(this)}>
                    <i className="icon-calendar"/>
                </button>
                {this.state.openDatePicker && (
                    <DatePickerCore value={this.props.input.value} onCancel={this.toggleOpenDatePicker.bind(this)}
                    onChange={this.onChange.bind(this)}/>
                )}
            </div>
        )
    }
}

DatePicker.propTypes = {
    input: React.PropTypes.shape({
        value: React.PropTypes.object,
        onChange: React.PropTypes.func,
    }).isRequired,
    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    className: PropTypes.string,
}
