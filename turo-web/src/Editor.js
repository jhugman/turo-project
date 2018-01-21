import React, { Component, PureComponent } from 'react';
import { Modifier, EditorState, DefaultDraftBlockRenderMap } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import Immutable from 'immutable';
import get from 'lodash/get';
import { UPDATE_STATEMENT } from './constants';
import Results from './Results';
import exampleDoc from './basic';
import debounce from 'lodash/debounce';
import * as actions from './actions';
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux';

import autoCompletePlugin from './plugins/autoCompletePlugin';
import selectionPositionPlugin from './plugins/selectionPosition';
import Popover from './plugins/popover';

const List = ({ list, onSelect}) => <ul>
  {list.map((item, index) => (
    <li onClick={(e) => onSelect(item)} key={index}>
      {item.literal}
    </li>
  ))}
</ul>

class Statement extends Component {
  render() {
    const id = this.props.children.key;
    return (
      <div className='statement'>
        <div className='statement__content'>
          {/* here, this.props.children contains a <section> container, as that was the matching element */}
          {this.props.children}
        </div>
      </div>
    );
  }
}

const blockRenderMap = DefaultDraftBlockRenderMap.merge(
  Immutable.Map({
    'unstyled': {
      element: Statement
    }
  })
);

class App extends Component {
  state = {
    selectionPosition: false,
    list: []
  }

  constructor(props) {
    super(props);

    this.plugins = [
      selectionPositionPlugin(),
      autoCompletePlugin(this.props.turoDoc)
    ];
  }

  autosaveDocument = debounce((doc) => {
    const contentState = doc.editorState.getCurrentContent();

    // check if cached contentState is the same, don't fire autosave if it is
    if (
      this.cachedTitle !== doc.title ||
      Immutable.is(contentState, this.cachedContent) === false
    ) {
      this.cachedTitle = doc.title;
      this.cachedContent = contentState;
      return this.props.autosaveDocument(doc);
    }
  }, 500);

  keyBindingFn = event => {
    console.log('keyBindingFn')
  }

  onSelectionPositionChange = selectionPosition => this.setState({ selectionPosition })

  onChange = (editorState) => {
    const { id, title } = this.props;

    this.props.updateEditorState(editorState);

    this.autosaveDocument({
      id,
      title,
      editorState
    });
  };

  onAutocomplete = tokens => {
    console.log('auto complete yo', tokens)
    if (tokens) {
      this.setState({
        list: tokens
      });
    }
  }

  handlePastedText = (text, html, editorState) => {
    console.log('handlePastedText')
  }

  onChangeTitle = ({ target: { value: title } }) => {
    this.props.updateDocument({ title });

    const { id, editorState } = this.props;

    this.autosaveDocument({
      id,
      title,
      editorState
    });
  }

  onAddToken = token => {
    console.log('yop', token);
  }

  componentWillMount() {
    if (!this.props.match.params.id) {
      this.props.createDocument({
        title: this.props.title,
        document: ''
      });
    } else {
      this.props.fetchDocument(this.props.match.params.id);
    }
  }

  render() {
    if (!this.props.id) {
      return <div className='loading'>Loading ...</div>
    } else if (this.props.id && !this.props.match.params.id) {
      return <Redirect to={{ pathname: `/${this.props.id}` }} />
    } else {
      return (
        <div className="document">
          <div className="top-bar">
            <input
              type="text"
              placeholder="Document Title"
              value={this.props.title}
              onChange={this.onChangeTitle}
            />
            <figure className="logo">
              <img src="logo.png" />
            </figure>

          </div>

          <div className='editor'>
            <div className='statements'>
              <Editor
                placeholder="... e.g: 1 + 2"
                editorState={this.props.editorState}
                plugins={this.plugins}
                onSelectionPositionChange={this.onSelectionPositionChange}
                onAutoComplete={this.onAutocomplete}
                blockRenderMap={blockRenderMap}
                onChange={this.onChange}
              />
              <Popover
                className="popover-style"
                position={this.state.selectionPosition}
              >
                <List
                  onSelect={this.onAddToken}
                  list={this.state.list}
                />
              </Popover>
            </div>
            <Results statements={this.props.turoDoc.statements} />
          </div>
        </div>
      );
    }
  }
}

const mapStateToProps = ({ id, title, turoDoc, editorState }) => ({
  id, title, turoDoc, editorState
});

export default connect(mapStateToProps, actions)(App);
