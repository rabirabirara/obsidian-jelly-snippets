export type LHS = string;
export interface RHS {
	data: string;
	info: {
		cursorEnd: number;
	};
}

export type Snippet = {
	lhs: LHS;
	rhs: RHS;
};
