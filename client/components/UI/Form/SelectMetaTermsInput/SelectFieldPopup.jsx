import React from 'react';
import PropTypes from 'prop-types';
import {SearchBar} from '../../';
import {differenceBy, get} from 'lodash';
import {uiUtils, onEventCapture} from '../../../../utils';
import classNames from 'classnames';
import './style.scss';

import {Popup} from '../../Popup';
import {KEYCODES} from '../../../../constants';

export class SelectFieldPopup extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentParent: null,
            selectedAncestry: [],
            search: false,
            activeOptionIndex: -1,
        };

        this.onKeyDown = this.onKeyDown.bind(this);
        this.filterSearchResults = this.filterSearchResults.bind(this);
        this.popParent = this.popParent.bind(this);
        this.chooseEntireCategory = this.chooseEntireCategory.bind(this);

        this.dom = {
            root: null,
            list: null,
            search: null
        };
    }

    onKeyDown(event) {
        if (event) {
            switch (event.keyCode) {
            case KEYCODES.ENTER:
                onEventCapture(event);
                this.handleEnterKey(event);
                break;
            case KEYCODES.DOWN:
                onEventCapture(event);
                this.handleDownArrowKey(event);
                break;
            case KEYCODES.UP:
                onEventCapture(event);
                this.handleUpArrowKey(event);
                break;
            case KEYCODES.LEFT:
                onEventCapture(event);
                if (this.state.selectedAncestry.length > 0) {
                    this.popParent(true);
                }
                break;
            case KEYCODES.RIGHT:
                onEventCapture(event);
                if (this.state.activeOptionIndex !== -1) {
                    this.onMutiLevelSelect(
                        this.state.filteredList[this.state.activeOptionIndex],
                        true
                    );
                }
                break;
            }
        }
    }

    handleEnterKey() {
        if (this.props.multiLevel) {
            if (this.state.activeOptionIndex !== -1) {
                this.onSelect(this.state.filteredList[this.state.activeOptionIndex]);
            } else {
                this.onSelect(this.state.currentParent);
            }
        } else if (this.state.activeOptionIndex !== -1) {
            this.onSelect(this.state.filteredList[this.state.activeOptionIndex]);
        }
    }

    handleDownArrowKey(event) {
        if (event.target.id && event.target.id.indexOf('SearchBar') >= 0) {
            // Lose focus on SearchBar
            event.target.blur();

            this.setState({activeOptionIndex: 0});
        } else if (this.state.activeOptionIndex < this.state.filteredList.length - 1) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex + 1});
            uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.dom.list);
        }
    }

    handleUpArrowKey() {
        if (this.state.activeOptionIndex === 0) {
            if (this.state.selectedAncestry.length === 0) {
                // Search bar handle
                // Focus the searchBar input
                this.dom.search.dom.searchIcon.focus();
                this.setState({activeOptionIndex: -1});
            } else {
                // Choose entire category
                this.setState({activeOptionIndex: -1});
            }
        } else {
            this.setState({activeOptionIndex: this.state.activeOptionIndex - 1});
            uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.dom.list);
        }
    }

    componentWillMount() {
        this.setState({filteredList: this.getFilteredOptionList()});
    }

    componentDidMount() {
        this.dom.search.dom.searchIcon.focus();
    }

    onSelect(opt) {
        this.props.onChange(opt);
    }

    getFilteredOptionList(currentParent, searchList) {
        if (this.props.multiLevel) {
            let filteredList;

            if (searchList) {
                filteredList = searchList;
            } else {
                filteredList = currentParent ?
                    this.props.options.filter((option) => (
                        option.parent === get(currentParent, this.props.valueKey)
                    ), this) :
                    this.props.options.filter((option) => !option.parent);
            }
            return filteredList;
        } else {
            return searchList ? searchList : this.props.options;
        }
    }

    onMutiLevelSelect(opt, keyDown = false) {
        if (opt && !this.state.searchList && this.isOptionAParent(opt)) {
            if (!this.state.selectedAncestry.find((o) => (opt[this.props.valueKey] === o[this.props.valueKey]))) {
                this.setState({
                    currentParent: opt,
                    selectedAncestry: [...this.state.selectedAncestry, opt],
                    filteredList: this.getFilteredOptionList(opt, null),
                    activeOptionIndex: 0,
                });
            }
        } else if (!keyDown) {
            this.onSelect(opt);
        }
    }

    isOptionAParent(opt) {
        return this.props.options.filter((option) => (
            option.parent === get(opt, this.props.valueKey)
        )).length > 0;
    }

    chooseEntireCategory() {
        this.onSelect(this.state.currentParent);
    }

    popParent(keydown) {
        const len = this.state.selectedAncestry.length;
        const opt = len > 1 ? this.state.selectedAncestry[len - 2] : null;
        const activeOption = keydown === true ? 0 : -1;

        onEventCapture(keydown);

        this.setState({
            currentParent: opt,
            selectedAncestry: this.state.selectedAncestry.splice(0, len - 1),
            filteredList: this.getFilteredOptionList(opt, null),
            activeOptionIndex: activeOption,
        });

        return true;
    }


    filterSearchResults(val) {
        if (!val) {
            this.setState({
                search: false,
                filteredList: this.getFilteredOptionList(null),
            });
            return;
        }

        const valueNoCase = val.toLowerCase();
        let searchResults = this.props.options.filter((opt) => (
            opt[this.props.searchKey].toLowerCase().substr(0, val.length) === valueNoCase ||
                opt[this.props.searchKey].toLowerCase().indexOf(valueNoCase) >= 0
        ));

        if (this.props.multiLevel && this.props.value) {
            searchResults = differenceBy(searchResults, this.props.value, this.props.valueKey);
        }

        this.setState({
            search: true,
            filteredList: this.getFilteredOptionList(null, searchResults),
        });
    }

    renderSingleLevelSelect() {
        return (
            <Popup
                close={this.props.onCancel}
                target={this.props.target}
                onKeyDown={this.onKeyDown}
            >
                <div className="Select__popup" ref={(node) => this.dom.root = node}>
                    <div className="Select__popup__search">
                        <SearchBar
                            onSearch={this.filterSearchResults}
                            minLength={1}
                            extendOnOpen={true}
                            ref={(node) => this.dom.search = node}
                            timeout={100}
                            allowCollapsed={false}
                        />
                    </div>
                    <ul className="Select__popup__list" ref={(node) => this.dom.list = node}>
                        {this.state.filteredList.map((opt, index) => (
                            <li
                                key={index}
                                className={classNames(
                                    'Select__popup__item',
                                    {'Select__popup__item--active': index === this.state.activeOptionIndex}
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={this.onSelect.bind(
                                        this,
                                        this.state.filteredList[index]
                                    )}
                                >
                                    <span>{get(opt, this.props.labelKey)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </Popup>
        );
    }

    renderMultiLevelSelect() {
        return (
            <Popup
                close={this.props.onCancel}
                target={this.props.target}
                onKeyDown={this.onKeyDown}
            >
                <div className="Select__popup" ref={(node) => this.dom.root = node}>
                    <div className="Select__popup__search">
                        { this.state.currentParent && (
                            <div className="search-handler">
                                <i className="backlink" onClick={this.popParent}/>
                                <button
                                    type="button"
                                    className={classNames(
                                        'Select__popup__category',
                                        {'Select__popup__item--active': this.state.activeOptionIndex === -1}
                                    )}
                                    onClick={this.chooseEntireCategory}
                                >
                                    <div className="Select__popup__parent">
                                        {get(this.state.currentParent, this.props.labelKey)}
                                    </div>
                                    <div className="Select__popup__parent--choose">
                                        Choose entire category
                                    </div>
                                </button>
                            </div>
                        ) || (
                            <SearchBar
                                onSearch={this.filterSearchResults}
                                minLength={1}
                                extendOnOpen={true}
                                ref={(node) => this.dom.search = node}
                                timeout={100}
                                allowCollapsed={false}
                            />
                        )
                        }
                    </div>
                    <ul className="dropdown-menu Select__popup__list" ref={(node) => this.dom.list = node}>
                        {this.state.filteredList.map((opt, index) => (
                            <li
                                key={index}
                                className={classNames(
                                    'Select__popup__item',
                                    {'Select__popup__item--active': index === this.state.activeOptionIndex}
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={this.onMutiLevelSelect.bind(
                                        this,
                                        this.state.filteredList[index],
                                        false
                                    )}
                                >
                                    <span>{get(opt, this.props.labelKey)}</span>
                                    { !this.state.search && this.isOptionAParent(opt) && (
                                        <i className="icon-chevron-right-thin" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </Popup>
        );
    }

    render() {
        return this.props.multiLevel ? this.renderMultiLevelSelect() : this.renderSingleLevelSelect();
    }
}

SelectFieldPopup.propTypes = {
    options: PropTypes.array.isRequired,
    onCancel: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    labelKey: PropTypes.string,
    valueKey: PropTypes.string,
    searchKey: PropTypes.string,
    multiLevel: PropTypes.bool,
    value: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.object,
    })),
    target: PropTypes.string,
};

SelectFieldPopup.defaultProps = {
    labelKey: 'name',
    valueKey: 'qcode',
    searchKey: 'name',
};
