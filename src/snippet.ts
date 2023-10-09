export type LHS = string;
export interface RHS {
	data: string;
	info: {
		hasNewline: boolean;
		cursorEnd: number;
	};
}

export type Snippet = {
	lhs: LHS;
	rhs: RHS;
};

export enum SnippetType {
	SLSR = 0,
	SLMR = 1,
	MLSR = 2,
	MLMR = 3,
}
