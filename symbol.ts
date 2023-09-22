import { RHS } from "snippet";

export enum Symbol {
	// on parse
	Newline = "%\\n",
	Tab = "%\\t",
	// on replace
	CursorEnd = "%\\e",
}

export namespace Symbol {
	const REPLACEABLE: Record<string, string> = {
		[Symbol.Newline]: "\n",
		[Symbol.Tab]: "\t",
	};
	// const ON_REPLACE: Record<string, string> = {
	// 	[Symbol.CursorEnd]: "",
	// };
	export function replaceSymbolsOnParse(inputStr: string): RHS {
		const result: string[] = [];
		const len = inputStr.length;
		let i = 0;
		let cursor = 0;
		let endFoundIdx = 0;
		let found;
		while (i < inputStr.length) {
			found = false;
			for (const symbol in REPLACEABLE) {
				if (inputStr.startsWith(symbol, i)) {
					result.push(REPLACEABLE[symbol]);
					console.log(REPLACEABLE[symbol]);
					cursor += REPLACEABLE[symbol].length;
					i += symbol.length;
					found = true;
					break;
				}
			}
			// Check for cursorEnd symbol.
			if (inputStr.startsWith(Symbol.CursorEnd, i)) {
				i += Symbol.CursorEnd.length;
				// cursor marks the index in final string, we derive the "how far to move left" from it
				endFoundIdx = cursor;
				found = true;
			}
			if (!found) {
				result.push(inputStr[i]);
				cursor++;
				i++;
			}
		}
		let data = result.join("");
		let info = {
			cursorEnd: data.length - endFoundIdx,
		};

		return { data, info };
	}
}

// Some tests!
// let rhs1 = Symbol.replaceSymbolsOnParse("123%\\e45678");
// console.log(rhs1);
// let rhs2 = Symbol.replaceSymbolsOnParse("12345678%\\e");
// console.log(rhs2);
// let rhs3 = Symbol.replaceSymbolsOnParse("%\\e12345678");
// console.log(rhs3);
// let rhs4 = Symbol.replaceSymbolsOnParse("12%\\e3");
// console.log(rhs4);
// let rhs5 = Symbol.replaceSymbolsOnParse("1%\\e23");
// console.log(rhs5);
// let rhs6 = Symbol.replaceSymbolsOnParse("%\\e123");
// console.log(rhs6);
// let rhs7 = Symbol.replaceSymbolsOnParse("123%\\n4%\\e56");
// console.log(rhs7);
// console.log(rhs7.data);
