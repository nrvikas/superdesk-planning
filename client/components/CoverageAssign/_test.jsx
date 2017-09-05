import React from 'react'
import { mount } from 'enzyme'
import { CoverageAssign } from './index'
import sinon from 'sinon'

const desks = [{
    _id: 123,
    name: 'Politic Desk',
    members: [
        { user: 345 },
    ],
},
{
    _id: 234,
    name: 'Sports Desk',
}]

const users = [{
    _id: 345,
    display_name: 'firstname lastname',
},
{
    _id: 456,
    display_name: 'firstname2 lastname2',
},
{
    _id: 'providerQCode',
    display_name: 'prvdr_firstname prvdr_lastname',
    provider: true,

}]

class TestForm extends React.Component {
    render() {
        const i = this.props.input ? this.props.input : {}
        return (
            <CoverageAssign
                input={i}
                usersMergedCoverageProviders={this.props.users}
                desks={this.props.desks} />
        )
    }
}

TestForm.propTypes = {
    users: React.PropTypes.array.isRequired,
    desks: React.PropTypes.array.isRequired,
    input: React.PropTypes.object,
}

describe('<CoverAssign />', () => {

    it('Opens assignment popup', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)

        wrapper.find('.coverageassign__action').at(1).simulate('click')
        expect(wrapper.find('.coverageassignselect').length).toBe(1)
    })

    it('Users are populated', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)

        wrapper.find('.coverageassign__action').at(1).simulate('click')
        const lst = wrapper.find('ul')
        expect(lst.children().length).toBe(3)
        const lbls = lst.at(0).find('.coverageassignselect__label')
        expect(lbls.get(0).textContent).toBe('firstname lastname')
        expect(lbls.get(1).textContent).toBe('firstname2 lastname2')
        expect(lbls.get(2).textContent).toBe('prvdr_firstname prvdr_lastname')
    })

    it('Desks are populated', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)
        wrapper.find('.coverageassign__action').at(1).simulate('click')
        const deskSelectFieldComponent = wrapper.find('DeskSelectField')
        expect(deskSelectFieldComponent.props().desks.length).toBe(2)
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk')
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk')
    })

    it('Selected desk populates only those users who belong that desk and coverage providers', () => {
        const input = { value: { desk: 123 } }
        const wrapper = mount(<TestForm users={users}
                desks={desks} input={input} />)
        wrapper.find('.coverageassign__action').at(1).simulate('click')
        const lst = wrapper.find('ul')
        expect(lst.children().length).toBe(2)
        const lbls = lst.at(0).find('.coverageassignselect__label')
        expect(lbls.get(0).textContent).toBe('firstname lastname')
        expect(lbls.get(1).textContent).toBe('prvdr_firstname prvdr_lastname')
    })

    it('Selecting a user populates only that user desk', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)
        wrapper.find('.coverageassign__action').at(1).simulate('click')

        const deskSelectFieldComponent = wrapper.find('DeskSelectField')
        expect(deskSelectFieldComponent.props().desks.length).toBe(2)
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk')
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk')

        const lst = wrapper.find('ul')
        lst.children().first().find('button').simulate('click')

        expect(deskSelectFieldComponent.props().desks.length).toBe(1)
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk')
    })

    it('Cannot save until a desk is selected', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)
        wrapper.find('.coverageassign__action').at(1).simulate('click')

        const lst = wrapper.find('ul')
        lst.children().first().find('button').simulate('click')

        expect(wrapper.find('.btn--primary').length).toBe(0)
    })

    it('Can unassign', () => {
        const input = {
            value: { desk: 123 },
            onChange: sinon.spy((value) => {
                expect(value).toEqual({
                    desk: null,
                    user: null,
                })
            }),
        }
        const wrapper = mount(<TestForm users={users}
                desks={desks} input={input} />)
        wrapper.find('.coverageassign__action').at(0).simulate('click')

        expect(input.onChange.calledOnce).toBe(true)
    })

    it('Shows desk assignment correctly with right avatar', () => {
        const input = { value: { desk: 123 } }
        const wrapper = mount(<TestForm users={users}
                desks={desks}
                input={input} />)
        const deskLbl = wrapper.find('label').get(0)
        expect(deskLbl.textContent).toBe('Desk: Politic Desk')
        expect(wrapper.find('.desk').length).toBe(1)
    })

    it('Shows user assignment correctly with right avatar', () => {
        const input = { value: { user: 456 } }
        const wrapper = mount(<TestForm users={users}
                desks={desks}
                input={input} />)
        const avatarLbl = wrapper.find('span')
        expect(avatarLbl.get(0).textContent).toBe('FL')
        const userLbl = wrapper.find('label').get(0)
        expect(userLbl.textContent).toBe('firstname2 lastname2')
        expect(wrapper.find('.initials').length).toBe(1)
    })

    it('Coverage provider is populated in user list for all desks', () => {
        // Select desk: 123
        let input = { value: { desk: 123 } }
        const wrapper = mount(<TestForm users={users}
                desks={desks} input={input} />)
        wrapper.find('.coverageassign__action').at(1).simulate('click')
        let lst = wrapper.find('ul')
        expect(lst.children().length).toBe(2)
        let lbls = lst.at(0).find('.coverageassignselect__label')
        expect(lbls.get(0).textContent).toBe('firstname lastname')
        expect(lbls.get(1).textContent).toBe('prvdr_firstname prvdr_lastname')

        // Select desk: 234
        input = { value: { desk: 234 } }
        const wrapper2 = mount(<TestForm users={users}
                desks={desks} input={input} />)
        wrapper2.find('.coverageassign__action').at(1).simulate('click')
        lst = wrapper2.find('ul')
        expect(lst.children().length).toBe(1)
        lbls = lst.at(0).find('.coverageassignselect__label')
        expect(lbls.get(0).textContent).toBe('prvdr_firstname prvdr_lastname')
    })

    it('Selecting a coverage provider displays all desks', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)
        wrapper.find('.coverageassign__action').at(1).simulate('click')

        const deskSelectFieldComponent = wrapper.find('DeskSelectField')
        expect(deskSelectFieldComponent.props().desks.length).toBe(2)
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk')
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk')

        const lst = wrapper.find('ul')
        const providerOption = lst.children().at(2)
        expect(providerOption.find('.coverageassignselect__label').get(0).textContent).toBe('prvdr_firstname prvdr_lastname')
        providerOption.find('button').simulate('click')

        expect(deskSelectFieldComponent.props().desks.length).toBe(2)
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk')
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk')
    })
})
