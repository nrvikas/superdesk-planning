import React, { PropTypes } from 'react'
import moment from 'moment'
import ReactDOM from 'react-dom'
import { range } from 'lodash'
import './styles.scss'

export class TimePickerCore extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            selectedHourIndex: 0,
            selectedMinuteIndex: 0,
            hourClickSelected: false,
            minClickSelected: false,
            currentTime: moment(),
        }
        this.handleClickOutside = this.handleClickOutside.bind(this)
    }

    componentWillMount() {
        let hourIndex, minIndex
        let inputDateTime = this.props.value && moment.isMoment(this.props.value) ? moment(this.props.value) : this.state.currentTime

        // Round it to nearest 5 mins mark if needed
        const diffMins = 5 - inputDateTime.minute() % 5
        if (diffMins !== 5) {
            inputDateTime = inputDateTime.add(diffMins, 'm')
        }

        hourIndex = inputDateTime.hour()
        minIndex = inputDateTime.minute() / 5

        this.setState({
            selectedHourIndex: hourIndex,
            selectedMinuteIndex: minIndex,
        })
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true)
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true)
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this)

        if ((!domNode || !domNode.contains(event.target))) {
            this.props.onCancel()
        }
    }

    setselectedHourIndex(val) {
        if (this.state.minClickSelected) {
            this.handleConfirm(val, this.state.selectedMinuteIndex)
        } else {
            this.setState({
                selectedHourIndex: val,
                hourClickSelected: true,
            })
        }
    }

    setselectedMinuteIndex(val) {
        if (this.state.hourClickSelected) {
            this.handleConfirm(this.state.selectedHourIndex, val)
        } else {
            this.setState({
                selectedMinuteIndex: val,
                minClickSelected: true,
            })
        }
    }

    addMinutes(mins) {
        this.state.currentTime.add(mins, 'm')
        this.props.onChange(this.state.currentTime.format('HH:mm'))
        this.props.onCancel()
    }

    handleConfirm(hour, minute) {
        this.props.onChange(hour + ':' + (minute * 5))
        this.props.onCancel()
    }

    handleCancel() {
        this.props.onCancel()
    }

    render() {
        const hours = range(0, 24)
        const minutes = range(0, 60, 5)
        return (
            <div className="timepickerPopup">
                <div className="timepickerPopup__core">
                    <div className="timepickerPopup__additional">
                        <table>
                            <tbody>
                                <tr>
                                    <td><button className="btn btn--mini" type="button" onClick={this.addMinutes.bind(this, 30)}>in 30 min</button></td>
                                    <td><button className="btn btn--mini" type="button" onClick={this.addMinutes.bind(this, 60)}>in 1 h</button></td>
                                    <td><button className="btn btn--mini" type="button" onClick={this.addMinutes.bind(this, 120)}>in 2 h</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="timepickerPopup__selectArea">
                        <div className="header">Hours</div>
                        <ul>
                            {hours.map((hour, index) => (
                                <li key={index} className={index === this.state.selectedHourIndex ? 'active' : ''} onClick={this.setselectedHourIndex.bind(this, index)}>{hour < 10 ? '0' + hour : hour}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="timepickerPopup__selectArea">
                        <div className="header">Minutes</div>
                        <ul>
                            {minutes.map((minute, index) => (
                            <li key={index} className={index === this.state.selectedMinuteIndex ? 'active' : ''} onClick={this.setselectedMinuteIndex.bind(this, index)}>{minute < 10 ? '0' + minute : minute}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <button className="btn btn--small pull-right" type="button" onClick={this.handleCancel.bind(this)}>Cancel</button>
                    </div>
                </div>
            </div>
        )
    }
}

TimePickerCore.propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}
