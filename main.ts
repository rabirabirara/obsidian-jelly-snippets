import {
	App,
	Editor,
	EditorPosition,
	MarkdownView,
	Modal,
	moment,
	Notice,
	Plugin,
	PluginSettingTab,
	prepareSimpleSearch,
	SearchResult,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!
// for DOM events: https://www.w3schools.com/jsref/dom_obj_event.asp

interface JellySnippetSettings {
	searchSnippetsFile: string;
	// regexSnippetsFile: string;
	// regexSnippets: [RegExp, string][];
	triggerOnSpace: boolean;
	triggerOnTab: boolean;
	snippetPartDivider: string;
	snippetDivider: string; // the string that splits snippets
	postSnippetCursorSymbol: string;
}
// TODO: implement cursor move after snippet replace.
// ? TODO: Can we implement growable lists in settings?

const DEFAULT_SETTINGS: JellySnippetSettings = {
	searchSnippetsFile: 
		String.raw`asd |+| snipped ya
		-==-
		- |+| #####
		-==-
		: |+| -
		-==-
		:: |+| hi
		`,
	// regexSnippetsFile: "",,
	// regexSnippets: [[new RegExp("^.*asd"), "asdf"]],
	triggerOnSpace: true,
	triggerOnTab: true, // TODO: Fix this so that if snippet triggers, the tab doesn't also go through. In fact, maybe fix it so that space doesn't go through either if snippet triggers.
	snippetPartDivider: " |+| ",
	snippetDivider: "-==-",
	postSnippetCursorSymbol: "%move%",
};

// TODO: I should use regexable snippets. Or at least implement it somehow somewhere.
// regex: ^.*(all the whitespace, word delimiters)<snippet regex>
/*
need regex literal and flags...
|=| |=|

The thing about regex snippets is that the more power we want to add, the harder it is to implement.
! Also, need to test safety of regex... use safe-regex (npm)
*/
// two modes: word snippets, with the standard delimiters (only as efficient as wordAt algorithm),
// search from cursorpos to head of editorrange given by wordAt

export default class JellySnippet extends Plugin {
	settings: JellySnippetSettings;
	private searchSnippets: { [key: string]: string };
	private searches: { [key: string]: (text: string) => SearchResult | null };

	async onload() {
		await this.loadSettings();

		this.parseSearchSnippets();
		this.prepareSearchesForSearchSnippets();

		this.registerDomEvent(document, "keydown", (evt: KeyboardEvent) => {
			if (
				(this.settings.triggerOnSpace && evt.code === "Space") ||
				(this.settings.triggerOnTab && evt.code === "Tab")
			) {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					// this.simpleWordSnippet(view.editor);
					// this.regexSnippet(view.editor);
					this.searchSnippet(view.editor);
				}
			}
		});

		this.addCommand({
			id: "trigger-search-snippet",
			name: "Trigger search snippet",
			editorCallback: (editor: Editor) => {
				this.searchSnippet(editor);
			},
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	parseSearchSnippets(): void {
		// go through the search snippets file, split by the snippet divider, split by the part divider, put in map
		let snippetLines = this.settings.searchSnippetsFile.split(this.settings.snippetDivider);
		for (let snippet of snippetLines) {
			let snippetParts = snippet.split(this.settings.snippetPartDivider);
			if (snippetParts.length === 2) {
				this.searchSnippets[snippetParts[0]] = snippetParts[1];
			} else {
				console.log("Failed to register search snippet: ", snippet);
			}
		}
	}

	prepareSearchesForSearchSnippets(): void {
		// for each snippet loaded, prepare a simple search.
		this.searches = {};
		for (let key in this.searchSnippets) {
			this.searches[key] = prepareSimpleSearch(key);
		}
	}

	triggerSnippet(editor: Editor): void {}

	regexSnippet(editor: Editor): void {
		let curpos = editor.getCursor();
		let startOfLine = curpos;
		startOfLine.ch = 0;
		let lhs = editor.getRange(startOfLine, curpos);
		// go through the regex snippets and check if any of the regexes match.
		// * Constraint: maybe shift the responsibility on the user to write regexes that match all the beginning.
		// e.g. "^.*([\s:/.,-])asd" would match an asd that comes right after a word delimiter/whitespace and any number of characters.
	}

	searchSnippet(editor: Editor): void {
		this.searchSnippets = {};

		// uses prepareSimpleSearch to search for matches that end right at cursor.
		// basically, get text from start of line to cursor, do simple search for each snippet lhs in that text, and replace first match that ends right at cursor.

		let curpos = editor.getCursor();
		let line = curpos.line;
		let curLineText = editor.getLine(line);

		for (let [lhs, search] of Object.entries(this.searches)) {
			let searchResult = search(curLineText);
			if (searchResult) {
				let matchpart = searchResult.matches.find(
					(part) => part[1] === curpos.ch,
				);
				if (matchpart) {
					let from: EditorPosition = { line: line, ch: matchpart[0] };
					let to: EditorPosition = { line: line, ch: matchpart[1] };
					editor.replaceRange(this.searchSnippets[lhs], from, to);
				}
			}
		}
	}

	// simpleWordSnippet(editor: Editor): void {
	// 	let curpos = editor.getCursor();
	// 	let curword = editor.wordAt(curpos);
	// 	if (curword) {
	// 		// check from curpos back to head of curword
	// 		let lhs = editor.getRange(curword.from, curpos);
	// 		// * if you have two of the same snippet, the most recent definition should take precedence.
	// 		if (lhs in this.settings.snippets) {
	// 			editor.replaceRange(this.settings.snippets[lhs], curword.from, curpos);
	// 		}
	// 	}
	// }
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: JellySnippet;

	constructor(app: App, plugin: JellySnippet) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "JellySnippet Settings" });

		new Setting(containerEl)
			.setName("Trigger on Space")
			.setDesc(
				"If enabled, the snippet function will trigger when space is pressed.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.triggerOnSpace)
					.onChange(async (value) => {
						this.plugin.settings.triggerOnSpace = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Trigger on Tab")
			.setDesc(
				"If enabled, the snippet function will trigger when tab is pressed.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.triggerOnSpace)
					.onChange(async (value) => {
						this.plugin.settings.triggerOnSpace = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
