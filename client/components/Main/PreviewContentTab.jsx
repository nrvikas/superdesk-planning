import React from 'react';
import PropTypes from 'prop-types';
import {getItemType} from '../../utils';
import {EventPreviewContent} from '../Events/EventPreviewContent';

export const PreviewContentTab = ({item}) => {
    const itemType = getItemType(item);

    switch (itemType) {
    case 'events':
        return (<EventPreviewContent />);
    default:
        return null;
    }
};

PreviewContentTab.propTypes = {
    item: PropTypes.object.isRequired,
};