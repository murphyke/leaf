/* Copyright (c) 2020, UW Medicine Research IT, University of Washington
 * Developed by Nic Dobbins and Cliff Spital, CRIO Sean Mooney
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */ 

import React from 'react';
import { Input } from 'reactstrap';
import './HelpSearch.css';

interface Props { }

interface State {
    searchValue: string;
}

export class HelpSearch extends React.Component<Props, State> {
    state = { searchValue: '' };
    private className = "help-search"

    public render() {
        const c = this.className;
        const { searchValue } = this.state;

        const s = new Map<number, string[]>();
        s.set(2, ['test', 'hello']);
        s.set(1, ['world']);

        // console.log([...s.entries()].sort());
        const ss = Array.from(s.keys()).sort();
        console.log(ss);

        return (
            // <div className={c}>
            //     <Input
            //         type="text"
            //         name="help-search"
            //         id="help-search"
            //         placeholder="Search..."
            //         bsSize="lg"
            //     />

            //     <div className={`${c}-input-clear`}>
            //         <span onClick={this.handleHelpSearchTextClear}>✖</span>
            //     </div>
            // </div>

            <div className={c}>
                {/* Search box container */}
                <div className={`${c}-input-container`}>
                    <Input 
                        className={`${c}-input leaf-input help-form-control`}
                        onChange={this.handleSearchInputChange}
                        // onKeyDown={this.handleSearchKeydown}
                        placeholder="Search..." 
                        spellCheck={false}
                        value={searchValue}
                    />

                    {/* Clear search text button */}
                    <div className={`${c}-input-clear`}>
                        {searchValue &&
                            <span onClick={this.handleSearchTextClear}>✖</span>
                        }
                    </div>
                </div>
            </div>
        );
    };

    private handleSearchInputChange = (e: React.FormEvent<HTMLInputElement>) => {
        this.setState({ searchValue: e.currentTarget.value });
    };

    private handleSearchTextClear = () => {
        this.setState({ searchValue: '' });
    };
};