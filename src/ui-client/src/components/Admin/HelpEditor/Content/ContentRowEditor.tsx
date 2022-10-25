/* Copyright (c) 2020, UW Medicine Research IT, University of Washington
 * Developed by Nic Dobbins and Cliff Spital, CRIO Sean Mooney
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */ 

import React from 'react';
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';
import { Col, Input, Row } from 'reactstrap';
import { AdminHelpPageContent } from '../../../../models/admin/Help';
import { FaFileDownload, FaFileUpload, FaRegWindowClose, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import { generate as generateId } from 'shortid';
import './ContentRowEditor.css';

interface Props {
    dispatch: any;
    contentRow: AdminHelpPageContent;
    index: number;
    isLastRow: boolean;
    contentHandler: (val: string, index: number) => void;
    deleteRowHandler: (index: number) => void;
    imageSizeHandler: (val: number, index: number) => void;
    newSectionHandler: (index: number, isTypeText: boolean, evt?: React.ChangeEvent<HTMLInputElement>) => void;
}

interface State {
    selected: boolean;
}

export class ContentRowEditor extends React.Component<Props, State> {
    private className = "content-row-editor";
    private textEditorClassName = "";

    constructor(props: Props){
        super(props)
        this.state = {
            selected: false
        }
    };

    public componentDidMount() {
        this.textEditorClassName = `${this.className}-markdown-text-edit-${generateId()}`;
    };

    public componentDidUpdate() {
        const textEditRowElement: any = document.getElementsByClassName(`${this.textEditorClassName}`);
        const focused = (document.activeElement === textEditRowElement[0]);
        
        // When text row is clicked, textarea already has focus and sets cursor to end of text.
        if (textEditRowElement && textEditRowElement[0] && !focused) {
            textEditRowElement[0].focus();
            textEditRowElement[0].selectionStart = textEditRowElement[0].value.length;
        };
    };

    // TODO:
    //      1. update category feature needed.
    //          - DONE; add css
    //      2. check admin workflow
    //          - ensure SPs delete category not in use

    public render() {
        const c = this.className;

        return (
            <div className={`${c}-container`}>
                <Row>
                    <Col md={12}>
                        {this.getContent()}
                    </Col>
                </Row>
            </div>
        );
    };

    private getContent = () => {
        const c = this.className;
        const { contentRow } = this.props;
        const { selected } = this.state;
        const imageRow = "image";
        const textRow = "text";
        const contentType = contentRow.type.toLowerCase();

        if (contentType === textRow) {
            if (!selected) {
                return (
                    <div className={`${c}-markdown`}>
                        {this.getEditButtons()}

                        <div className={`${c}-markdown-text`} onClick={this.handleClick}>
                            {/* linkTarget allows for links to open in new tab. Also prevents content row from being selected on link clicks. */}
                            <ReactMarkdown children={contentRow.textContent ? contentRow.textContent : 'Placeholder text'} linkTarget={"_blank"} />
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className={`${c}-markdown`}>
                        <TextareaAutosize
                            className={this.textEditorClassName}
                            onBlur={this.handleBlur}
                            onChange={this.handleChange}
                            placeholder={'Enter text'}
                            value={contentRow.textContent}
                        />
                    </div>
                );
            }
        } else if (contentType === imageRow) {
            return (
                <div className={`${c}-markdown`}>
                    {this.getEditButtons()}

                    <img
                        alt={contentRow.imageId}
                        className={`${c}-markdown-image`}
                        src={`data:image;base64,${contentRow.imageContent}`}
                        style={{maxWidth: `${contentRow.imageSize}%`}}
                    />
                </div>
            );
        };
        return ;
    };

    private getEditButtons = () => {
        const c = this.className;
        const { contentRow, isLastRow } = this.props;
        const editButton = `${c}-markdown-edit-button`;
        const imageUploadStyle = { display: "none" };
        const isLastRowClassname = (isLastRow && !contentRow.imageContent) ? 'is-last-row' : '';

        return (
            <div className={`${c}-markdown-edit-buttons ${isLastRowClassname}`}>
                {!isLastRow && <FaRegWindowClose className={editButton} onClick={this.deleteRow} />}
                <FaSortAlphaUp className={editButton} onClick={this.handleNewSection.bind(null, true, true)}/>
                <label htmlFor={`${contentRow.id}-above`} className={editButton}>
                    <FaFileUpload className={editButton} />
                    <input id={`${contentRow.id}-above`} type="file" accept="image/*" style={imageUploadStyle} onChange={this.handleNewSection.bind(null, true, false)}/>
                </label>
                <label htmlFor={`${contentRow.id}-below`} className={editButton}>
                    <FaFileDownload className={editButton} />
                    <input id={`${contentRow.id}-below`} type="file" accept="image/*" style={imageUploadStyle} onChange={this.handleNewSection.bind(null, false, false)}/>
                </label>
                <FaSortAlphaDown className={editButton} style={{marginTop: "-5px"}} onClick={this.handleNewSection.bind(null, false, true)}/>

                {contentRow.imageContent &&
                    <Input className={`${editButton} image-size`} type="number" onChange={this.imageSizeChange} min={30} max={100} value={contentRow.imageSize} />
                }
            </div>
        );
    };

    private handleBlur = () => { this.setState({ selected: false }) };

    private handleClick = () => { this.setState({ selected: true }) };

    private handleChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const { contentHandler, index } = this.props;
        const newVal = e.currentTarget.value;
        contentHandler(newVal, index);
    };    

    private handleNewSection = (isAbove: boolean, isTypeText: boolean, evt?: any) => {
        const { index, newSectionHandler } = this.props;
        const updatedIndex = isAbove ? index : index+1;
        newSectionHandler(updatedIndex, isTypeText, evt);
        this.setState({ selected: false });
    };

    private imageSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { imageSizeHandler, index } = this.props;
        const newImageSize = e.currentTarget.valueAsNumber;
        imageSizeHandler(newImageSize, index);
    };

    private deleteRow = () => {
        const { deleteRowHandler, index } = this.props;
        deleteRowHandler(index);
    };
}