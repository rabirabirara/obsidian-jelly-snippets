export enum Symbol {
	// on parse
	Newline = "\\nl\\",
	Tab = "\\tab\\",
	// on replace
	CursorEnd = "\\end\\",
}

export namespace Symbol {
	export const MAP: Record<string, string> = {
		[Symbol.Newline]: "\n",
		[Symbol.Tab]: "\t",
		[Symbol.CursorEnd]: "",
	};
	export function replaceSymbols(inputStr: string): string {
		const result: string[] = [];
		let i = 0;

		while (i < inputStr.length) {
			let found = false;
			for (const symbol in MAP) {
				if (inputStr.startsWith(symbol, i)) {
					result.push(MAP[symbol]);
					i += symbol.length;
					found = true;
					break;
				}
			}
			if (!found) {
				result.push(inputStr[i]);
				i++;
			}
		}

		return result.join("");
	}
}
