/* 
eth-address-observer is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

eth-address-observer is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with eth-address-observer.  If not, see <https://www.gnu.org/licenses/>.
*/
/**
 * @file eth-transactions-manager.ts
 * @author Vitaly Snitovets <v.snitovets@gmail.com>
 * @date 2020
 */

import Web3 from "web3";
import { EventEmitter } from "events";
import { EthTransaction } from "./eth-transaction";

export class EthTransactionsManager extends EventEmitter {
	private readonly web3: Web3;
	private readonly confirmationsRequired: number;
	private transactions: Map<string, EthTransaction>;

	constructor(web3: Web3, confirmationsRequired: number) {
		super();
		this.web3 = web3;
		this.confirmationsRequired = confirmationsRequired;
		this.transactions = new Map();
	}

	async add(transactionHash: string): Promise<void> {
		const ethTransaction = new EthTransaction(this.web3, transactionHash, this.confirmationsRequired);

		ethTransaction.on("pending", (transactionHash: string) => {
			this.emit("pending", transactionHash);
		});
		ethTransaction.on("confirmation", (confirmationNumber: number, transactionHash: string) => {
			this.emit("confirmation", confirmationNumber, transactionHash);
		});
		ethTransaction.once("success", (transactionHash: string) => {
			this.remove(transactionHash);
			this.emit("success", transactionHash);
		});

		ethTransaction.init().then(() => {
			this.transactions.set(transactionHash, ethTransaction);
		});
	}

	process(latestBlockNumber: number): void {
		this.transactions.forEach((ethTransaction) => ethTransaction.process(latestBlockNumber));
	}

	private remove(transactionHash: string): void {
		this.transactions.delete(transactionHash);
	}
}
