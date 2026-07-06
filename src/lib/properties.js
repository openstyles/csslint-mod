/* eslint-disable max-len */
import Properties from './properties.json' with {type: 'json'};

Object.setPrototypeOf(Properties, null);

Properties['-ms-appearance'] = 'icon | ' + (
  Properties['-o-appearance'] = 'none | window | desktop | workspace | document | tooltip | dialog | button | push-button | hyperlink | radio | radio-button | checkbox | menu-item | tab | menu | menubar | pull-down-menu | pop-up-menu | list-menu | radio-group | checkbox-group | outline-tree | range | field | combo-box | signature | password | normal'
);

export default Properties;
