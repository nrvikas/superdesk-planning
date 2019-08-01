import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';
import {gettext, getItemType, eventUtils, planningUtils, getDateTimeString} from '../utils';
import {ITEM_TYPE, EVENTS, PLANNING} from '../constants';

import {Button} from './UI';
import {SelectInput, Row} from './UI/Form';
import {Item, Column, Row as ListRow} from './UI/List';
import {Modal} from './index';
import SortItems from './SortItems/index';
import {renderFields} from './fields';

export class ExportAsArticleModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            template: this.props.modalProps.defaultTemplate,
            desk: this.props.modalProps.defaultDesk,
            items: this.props.modalProps.items,
            articleTemplate: this.props.modalProps.defaultArticleTemplate,
            articleTemplates: this.props.modalProps.articleTemplates,
        };

        this.onChange = this.onChange.bind(this);
        this.onSortChange = this.onSortChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.filterArticleTemplates = this.filterArticleTemplates.bind(this);
        this.getListElement = this.getListElement.bind(this);
    }

    componentDidMount() {
        this.filterArticleTemplates(this.state.desk);
    }

    onChange(field, value) {
        if (field === 'desk') { // on desk change filter article-templates based on desk selected
            this.filterArticleTemplates(value);
        }
        this.setState({[field]: value});
    }

    onSubmit() {
        const {
            desk,
            template,
            items,
            articleTemplate,
        } = this.state;

        this.props.modalProps.action(items, get(desk, '_id'), get(template, 'name'),
            get(this.props, 'modalProps.type'), get(this.props, 'modalProps.download'), get(articleTemplate, '_id'));
        this.props.handleHide();
    }

    onSortChange(items) {
        this.setState({items: items});
    }

    filterArticleTemplates(desk) {
        const newObj = {};

        newObj.articleTemplates = this.props.modalProps.articleTemplates.filter((t) =>
            Object.keys(t).length > 0 && t.template_desks && t.template_desks.includes(desk._id));
        newObj.articleTemplate = newObj.articleTemplates.find((t) =>
            Object.keys(t).length > 0 && t._id === get(desk, 'default_content_template'))
            || newObj.articleTemplates[0];

        this.setState((prevState) => ({...prevState, ...newObj}));
    }

    getListElement(item) {
        const {
            exportListFields,
            dateFormat,
            timeFormat,
            agendas,
        } = this.props.modalProps;
        const itemType = getItemType(item);
        let primaryFields, secFields, dateStr;

        if (itemType === ITEM_TYPE.EVENT) {
            primaryFields = EVENTS.EXPORT_LIST.PRIMARY_FIELDS;
            secFields = EVENTS.EXPORT_LIST.SECONDARY_FIELDS;
            dateStr = eventUtils.getDateStringForEvent(item, dateFormat, timeFormat, false, true, true);
        } else {
            primaryFields = PLANNING.EXPORT_LIST.PRIMARY_FIELDS;
            secFields = PLANNING.EXPORT_LIST.SECONDARY_FIELDS;
            dateStr = getDateTimeString(item.planning_date, dateFormat, timeFormat, ' @ ', false) || '';
        }

        return (<Item>
            <Column grow={true} border={false}>
                <ListRow>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {renderFields(get(exportListFields,
                            `${itemType}.primary_fields`, primaryFields), item,
                        {
                            alternateFieldName: 'definition_short',
                            agendas: planningUtils.getAgendaNames(item, agendas),
                        })}
                    </span>
                </ListRow>
                <ListRow>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {renderFields(get(exportListFields,
                            `${itemType}.secondary_fields`, secFields), item,
                        {
                            alternateFieldName: 'definition_short',
                            agendas: planningUtils.getAgendaNames(item, agendas),
                        })}
                    </span>
                    {dateStr && <time className="no-padding"><i className="icon-time"/>{dateStr}</time>}
                </ListRow>
            </Column>
        </Item>);
    }

    render() {
        const {
            items,
            desks,
            templates,
            download,
        } = this.props.modalProps;

        const {
            desk,
            template,
            articleTemplate,
            articleTemplates,
        } = this.state;

        return (
            <Modal show={true}>
                <Modal.Header>
                    <h3>{gettext('Export as article')}</h3>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <SortItems
                            items={items}
                            onSortChange={this.onSortChange}
                            getListElement={this.getListElement} />
                    </Row>
                    {!download && [<Row key={0}>
                        <SelectInput
                            field="desk"
                            label={gettext('Desk')}
                            value={desk}
                            onChange={this.onChange}
                            options={desks}
                            labelField="name"
                            keyField="_id" />
                    </Row>,
                    <Row key={1}>
                        <SelectInput
                            field="articleTemplate"
                            label={gettext('Select Article Template')}
                            value={articleTemplate}
                            onChange={this.onChange}
                            options={articleTemplates}
                            labelField="template_name"
                            keyField="_id"
                            clearable />
                    </Row>]}
                    <Row>
                        <SelectInput
                            field="template"
                            label={gettext('Custom Layout')}
                            value={template}
                            onChange={this.onChange}
                            options={templates}
                            labelField="label"
                            keyField="name"
                            clearable />
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button type="button"
                        onClick={this.props.handleHide}>{gettext('Cancel')}</Button>
                    {!download && <Button type="submit" className="btn--primary" disabled={!desk}
                        onClick={this.onSubmit}>{gettext('Export')}</Button>}
                    {download && <Button type="submit" className="btn--primary"onClick={this.onSubmit}>
                        {gettext('Download')}</Button>}
                </Modal.Footer>
            </Modal>
        );
    }
}

ExportAsArticleModal.propTypes = {
    handleHide: PropTypes.func,
    modalProps: PropTypes.shape({
        items: PropTypes.array,
        desks: PropTypes.array,
        templates: PropTypes.array,
        defaultDesk: PropTypes.object,
        defaultTemplate: PropTypes.object,
        onSortChange: PropTypes.func,
        action: PropTypes.func,
        download: PropTypes.bool,
        articleTemplates: PropTypes.array,
        defaultArticleTemplate: PropTypes.object,
        exportListFields: PropTypes.object.isRequired,
        dateFormat: PropTypes.string,
        timeFormat: PropTypes.string,
        agendas: PropTypes.array,
    }),
};
