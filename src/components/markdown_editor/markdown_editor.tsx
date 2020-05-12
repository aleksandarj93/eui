/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, {
  createElement,
  FunctionComponent,
  HTMLAttributes,
  useMemo,
  useState,
} from 'react';
import unified, { PluggableList } from 'unified';
import classNames from 'classnames';
// @ts-ignore
import emoji from 'remark-emoji';
import markdown from 'remark-parse';
// @ts-ignore
import remark2rehype from 'remark-rehype';
// @ts-ignore
import highlight from 'remark-highlight.js';
// @ts-ignore
import rehype2react from 'rehype-react';

import { CommonProps } from '../common';
import MarkdownActions from './markdown_actions';
import { EuiMarkdownEditorToolbar } from './markdown_editor_toolbar';
import { EuiMarkdownEditorTextArea } from './markdown_editor_text_area';
import { EuiMarkdownFormat } from './markdown_format';
import { EuiMarkdownEditorDropZone } from './markdown_editor_drop_zone';
import { htmlIdGenerator } from '../../services/accessibility';
import { EuiLink } from '../link';
import { EuiCodeBlock } from '../code';
import { MARKDOWN_MODE, MODE_EDITING, MODE_VIEWING } from './markdown_modes';

function storeMarkdownTree() {
  return function(tree: any, file: any) {
    file.data.markdownTree = JSON.parse(JSON.stringify(tree));
  };
}

export const defaultParsingPlugins: PluggableList = [
  [markdown, {}],
  [highlight, {}],
  [emoji, { emoticon: true }],
  [storeMarkdownTree, {}],
];

export const defaultProcessingPlugins: PluggableList = [
  [remark2rehype, { allowDangerousHTML: true }],
  [
    rehype2react,
    {
      createElement: createElement,
      components: {
        a: EuiLink,
        code: (props: any) =>
          // if has classNames is a codeBlock using highlight js
          props.className ? (
            <EuiCodeBlock {...props} />
          ) : (
            <code className="euiMarkdownFormat__code" {...props} />
          ),
      },
    },
  ],
];

export type EuiMarkdownEditorProps = HTMLAttributes<HTMLDivElement> &
  CommonProps & {
    /** A unique ID to attach to the textarea. If one isn't provided, a random one
     * will be generated */
    editorId?: string;

    /** A markdown content */
    value: string;

    /** Callback function when markdown content is modified */
    onChange: (value: string) => void;

    /** The height of the content/preview area */
    height?: number;

    /** array of unified plugins to parse content into an AST */
    parsingPluginList?: PluggableList;

    /** array of unified plugins to convert the AST into a ReactNode */
    processingPluginList?: PluggableList;
  };

export const EuiMarkdownEditor: FunctionComponent<EuiMarkdownEditorProps> = ({
  className,
  editorId: _editorId,
  value,
  onChange,
  height = 150,
  parsingPluginList = defaultParsingPlugins,
  processingPluginList = defaultProcessingPlugins,
  ...rest
}) => {
  const [viewMode, setViewMode] = useState<MARKDOWN_MODE>(MODE_EDITING);
  const editorId = useMemo(() => _editorId || htmlIdGenerator()(), [_editorId]);

  const markdownActions = useMemo(() => new MarkdownActions(editorId), [
    editorId,
  ]);

  const classes = classNames('euiMarkdownEditor', className);

  const processor = useMemo(
    () =>
      unified()
        .use(parsingPluginList)
        .use(processingPluginList),
    [parsingPluginList, processingPluginList]
  );

  const isPreviewing = viewMode === MODE_VIEWING;

  return (
    <div className={classes} {...rest}>
      <EuiMarkdownEditorToolbar
        markdownActions={markdownActions}
        onClickPreview={() =>
          setViewMode(isPreviewing ? MODE_EDITING : MODE_VIEWING)
        }
        viewMode={viewMode}
      />

      {isPreviewing ? (
        <div
          className="euiMarkdownEditor__previewContainer"
          style={{ height: `${height}px` }}>
          <EuiMarkdownFormat processor={processor}>{value}</EuiMarkdownFormat>
        </div>
      ) : (
        <EuiMarkdownEditorDropZone>
          <EuiMarkdownEditorTextArea
            height={height}
            id={editorId}
            onChange={e => onChange(e.target.value)}
            value={value}
          />
        </EuiMarkdownEditorDropZone>
      )}
    </div>
  );
};