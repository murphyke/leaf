/* Copyright (c) 2022, UW Medicine Research IT, University of Washington
 * Developed by Nic Dobbins and Cliff Spital, CRIO Sean Mooney
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */ 

import { generate as generateId } from 'shortid';
import { Note } from '../../models/cohort/NoteSearch';

const SEARCH = 'SEARCH';
const INDEX = 'INDEX';
const FLUSH = 'FLUSH';

interface InboundMessagePartialPayload {
    message: string;
    notes?: Note[];
    terms?: string[];
}

interface InboundMessagePayload extends InboundMessagePartialPayload {
    requestId: string;
}

interface OutboundMessagePayload {
    requestId: string;
    result?: any;
}

interface WorkerReturnPayload {
    data: OutboundMessagePayload;
}

interface PromiseResolver {
    reject: any;
    resolve: any;
}

interface Position {
    documentName: string;
    startIndex: number;
    endIndex: number;
};

interface IndexDocument {
    documents: string[]; 
    positions: { [key: string]: number[] },
    documentPositions: Position[],
}

interface IndexedDocuments {
    [key: string]: IndexDocument
}

export interface InvertedIndex {
    index: IndexedDocuments
}

export interface SearchResult {
    [key: string]: IndexDocument[];
}

interface IndexedSpan {
    lexeme: string;
    startCharIndex: number;
    endCharIndex: number;
}

export default class NoteSearchWebWorker {
    private worker: Worker;
    private reject: any;
    private promiseMap: Map<string, PromiseResolver> = new Map();

    constructor() {
        const workerFile = `  
            ${this.addMessageTypesToContext([ INDEX, FLUSH, SEARCH ])}
            ${this.stripFunctionToContext(this.workerContext)}
            self.onmessage = function(e) {  
                self.postMessage(handleWorkMessage.call(this, e.data, postMessage)); 
            }`;
        // console.log(workerFile);
        const blob = new Blob([workerFile], { type: 'text/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
        this.worker.onmessage = result => this.handleReturnPayload(result);
        this.worker.onerror = error => { console.log(error); this.reject(error) };
    }

    public search = (terms: string[]) => {
        return this.postMessage({ message: SEARCH, terms });
    }

    public index = (notes: Note[]) => {
        return this.postMessage({ message: INDEX, notes });
    }

    public flush = () => {
        return this.postMessage({ message: FLUSH });
    }

    private postMessage = (payload: InboundMessagePartialPayload) => {
        return new Promise((resolve, reject) => {
            const requestId = generateId();
            this.reject = reject;
            this.promiseMap.set(requestId, { resolve, reject });
            this.worker.postMessage({ ...payload, requestId });
        });
    }

    private handleReturnPayload = (payload: WorkerReturnPayload): any => {
        const data = payload.data.result ? payload.data.result : {}
        const resolve = this.promiseMap.get(payload.data.requestId)!.resolve;
        this.promiseMap.delete(payload.data.requestId);
        return resolve(data);
    }

    private stripFunctionToContext = (f: () => any) => {
        const funcString = `${f}`;
        return funcString
            .substring(0, funcString.lastIndexOf('}'))
            .substring(funcString.indexOf('{') + 1)
    }

    private addMessageTypesToContext = (messageTypes: string[]) => {
        return messageTypes.map((v: string) => `var ${v} = '${v}';`).join(' ');
    }

    private workerContext = () => {

        let inverted: InvertedIndex = { index: {} };

        // eslint-disable-next-line
        const handleWorkMessage = (payload: InboundMessagePayload): any => {
            switch (payload.message) {
                case INDEX:
                    return indexDocuments(payload);
                case FLUSH:
                    return flushNotes(payload);
                case SEARCH:
                    return search(payload);
                default:
                    return null;
            }
        };

        const indexDocuments = (payload: InboundMessagePayload): OutboundMessagePayload => {
            const { requestId } = payload;
            const { notes } = payload;

            for (const note of notes) {
                indexDocument(note);
                indexPositionIndices(note);
            }

            return { requestId };
        }

        const flushNotes = (payload: InboundMessagePayload): OutboundMessagePayload => {
            const { requestId } = payload;

            inverted.index = {}
            return { requestId };
        };

        const indexDocument = (note: Note): void => {
            const spans = splitWithIndex(note.text, " ");
            // Create dictionary variables
            for (const span of spans) {
                if (span.lexeme in this.index) {
                    // Add word as index
                    inverted.index[span.lexeme].documents.push(note.id);
                    inverted.index[span.lexeme].documentPositions.push({
                        documentName: note.id,
                        startIndex: span.startCharIndex,
                        endIndex: span.endCharIndex
                    });
                } else {
                    // Add index with text
                    inverted.index[span.lexeme] = { 
                        documents: [note.id], 
                        positions: {}, 
                        documentPositions: []
                     };
                }
            }
        }

        const indexPositionIndices = (note: Note): void => {
            const spans = note.text.split(" ");
            for (let i = 0; i < spans.length; i++) {
                if (!(note.id in inverted.index[spans[i]].positions)) { 
                    inverted.index[spans[i]].positions[note.id] = [i];
                } else {
                    inverted.index[spans[i]].positions[note.id].push(i);
                }
            }
        }

        const bm25 = (terms: string[]): SearchResult => {
            const result: SearchResult = { };

            // TODO

            return result;
        };

        const search = (payload: InboundMessagePayload): OutboundMessagePayload => {
            const { requestId } = payload;
            const { terms } = payload;

            //search inverted index for words and their occurrences
            let result: SearchResult = { };

            for (const token of terms) {
                if (token in inverted.index) {
                    if (!(token in result)) { 
                        result[token] = [inverted.index[token]]; 
                    } else {
                        result[token].push(inverted.index[token]);
                    }
                }
            }
            return { requestId, result };
        }

        const splitWithIndex = (text: string, delimiter: string): IndexedSpan[] => {
            const values: IndexedSpan[] = [];
            const splits = text.split(delimiter);
            var index = 0;
            for(var i = 0; i < splits.length; i++){
                values.push({
                    lexeme: splits[i], 
                    startCharIndex: index, 
                    endCharIndex: index + splits[i].length 
                });
                index += splits[i].length + delimiter.length;
            }
            return values;
        }
    }
}



