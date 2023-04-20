import {
	App,
	Editor,
	EditorPosition,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	prepareSimpleSearch,
	SearchResult,
	Setting,
} from "obsidian";

enum AutoTriggerOptions {
	Disabled = "disabled",
	EnabledNoWS = "n-ws",
	EnabledYesWS = "y-ws",
}

interface JellySnippetsSettings {
	searchSnippetsFile: string;
	// regexSnippetsFile: string;
	// regexSnippets: [RegExp, string][];
	triggerOnSpace: AutoTriggerOptions;
	triggerOnEnter: AutoTriggerOptions;
	triggerOnTab: AutoTriggerOptions;
	snippetPartDivider: string;
	snippetDivider: string;
	postSnippetCursorSymbol: string;
}
// TODO: implement cursor move after snippet replace.
// ? TODO: Can we implement growable lists in settings?

const DEFAULT_SETTINGS: JellySnippetsSettings = {
	searchSnippetsFile: String.raw`Snip me! |+| Snippet successfully replaced.
-==-
- |+| #####
-==-
: |+| -
-==-
:: |+| hi`,
	// regexSnippetsFile: "",,
	// regexSnippets: [[new RegExp("^.*asd"), "asdf"]],
	triggerOnSpace: AutoTriggerOptions.Disabled,
	triggerOnEnter: AutoTriggerOptions.Disabled,
	triggerOnTab: AutoTriggerOptions.Disabled,
	snippetPartDivider: " |+| ",
	snippetDivider: "-==-",
	postSnippetCursorSymbol: "%move%", // TODO: Actually implement this symbol.
};

// TODO: Add semantic symbols to represent certain special characters.
// TODO: Also implement those semantic symbols for control characters.
// Specifically, allow me to add a "whitespace" symbol so that I can put newlines in snippets if I need.
// TODO: I should use regexable snippets. Or at least implement it somehow somewhere.
// regex: ^.*(all the whitespace, word delimiters)<snippet regex>
/*
The thing about regex snippets is that the more power we want to add, the harder it is to implement.
! Also, need to test safety of regex... use safe-regex (npm)
*/

export default class JellySnippets extends Plugin {
	settings: JellySnippetsSettings;
	private searchSnippets: { [key: string]: string } = {};
	private searches: { [key: string]: (text: string) => SearchResult | null } =
		{};

	async onload() {
		await this.loadSettings();

		// Check settings and load search snippets in.
		this.reloadSearchSnippets();

		// If keydown events are set...
		if (
			this.settings.triggerOnSpace !== AutoTriggerOptions.Disabled ||
			this.settings.triggerOnTab !== AutoTriggerOptions.Disabled ||
			this.settings.triggerOnEnter !== AutoTriggerOptions.Disabled
		) {
			const onKeyEvent = (evt: KeyboardEvent) => {
				if (
					!evt.shiftKey // TODO: add function to determine when not to trigger. don't trigger if shift is pressed down as well e.g.
				) {
					const mdFile = this.app.workspace.activeEditor;
					if (mdFile?.editor) {
						this.triggerSearchSnippetAutomatically(mdFile.editor, evt);
					}
				}
			};

			// Register for main window.
			this.registerDomEvent(document, "keydown", onKeyEvent);

			// If window changes, registerDomEvent for new window if so.
			this.registerEvent(
				this.app.workspace.on("window-open", (event) => {
					this.registerDomEvent(activeWindow, "keydown", onKeyEvent);
				}),
			);
		}

		this.addCommand({
			id: "trigger-search-snippet",
			name: "Trigger search snippet",
			editorCallback: (editor: Editor) => {
				this.triggerSearchSnippet(editor);
			},
		});

		this.addCommand({
			id: "reload-snippets",
			name: "Reload snippets",
			callback: () => {
				this.reloadSearchSnippets();
			},
		});

		this.addSettingTab(new JellySnippetsSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	reloadSearchSnippets(): void {
		this.searchSnippets = {};
		this.searches = {};
		this.parseSearchSnippets();
		this.prepareSearchesForSearchSnippets();
	}

	parseSearchSnippets(): void {
		// go through the search snippets file, split by the snippet divider, split by the part divider, put in map
		let snippetLines = this.settings.searchSnippetsFile.split(
			this.settings.snippetDivider,
		);
		for (let snippet of snippetLines) {
			// trim() is used so that each snippet line does not retain newlines.
			// TODO: Add the newline symbol for dividers.
			let snippetParts = snippet.trim().split(this.settings.snippetPartDivider);
			let lhs = snippetParts.shift();
			let rhs = snippetParts.join(this.settings.snippetPartDivider);
			if (lhs === undefined) {
				console.log("Failed to register search snippet: ", snippet);
			} else {
				this.searchSnippets[lhs] = rhs;
			}
		}
	}

	prepareSearchesForSearchSnippets(): void {
		// for each snippet loaded, prepare a simple search.
		for (let key in this.searchSnippets) {
			this.searches[key] = prepareSimpleSearch(key);
		}
	}

	// triggerRegexSnippet(editor: Editor): void {
	// 	let curpos = editor.getCursor();
	// 	let startOfLine = curpos;
	// 	startOfLine.ch = 0;
	// 	let lhs = editor.getRange(startOfLine, curpos);
	// 	// go through the regex snippets and check if any of the regexes match.
	// 	// * Constraint: maybe shift the responsibility on the user to write regexes that match all the beginning.
	// 	// e.g. "^.*([\s:/.,-])asd" would match an asd that comes right after a word delimiter/whitespace and any number of characters.
	// }

	triggerSearchSnippetAutomatically(editor: Editor, evt: KeyboardEvent) {
		// remember the order: enter and tab come out before code triggers, space comes out after.
		switch (evt.key) {
			case " ": {
				if (this.settings.triggerOnSpace !== AutoTriggerOptions.Disabled) {
					if (this.triggerSearchSnippet(editor)) {
						// TODO: actually provide autotriggeroptions for Space.
						// Currently impossible to undo the space because the entire snippet
						// and all this code triggers before the space actually happens.
						return true;
					}
				}
				break;
			}
			case "Tab": {
				if (this.settings.triggerOnTab !== AutoTriggerOptions.Disabled) {
					if (this.triggerSearchSnippet(editor)) {
						if (this.settings.triggerOnTab === AutoTriggerOptions.EnabledNoWS) {
							editor.exec("indentLess");
						}
						return true;
					}
				}
				break;
			}
			case "Enter": {
				if (this.settings.triggerOnEnter !== AutoTriggerOptions.Disabled) {
					// TODO: Could be inefficient. Profiling needed?
					let curpos = editor.getCursor();
					let aboveline = curpos.line - 1;
					let abovelineEnd = editor.getLine(aboveline).length;
					let peekPos: EditorPosition = { line: aboveline, ch: abovelineEnd };
					if (this.triggerSearchSnippet(editor, peekPos)) {
						if (
							this.settings.triggerOnEnter === AutoTriggerOptions.EnabledNoWS
						) {
							// undo the already created newline by deleting everything from curpos to above line's end
							// yes, you need to recalculate the above line's end else it will use an incorrect position
							let aboveLine = editor.getCursor().line - 1;
							let aboveLineEnd = editor.getLine(aboveLine).length;
							let aboveLineEndPos: EditorPosition = {
								line: aboveLine,
								ch: aboveLineEnd,
							};
							editor.replaceRange("", aboveLineEndPos, curpos);
						}
						return true;
					}
				}
			}
			default: {
				break;
			}
		}
		return false;
	}

	triggerSearchSnippet(
		editor: Editor,
		pos: EditorPosition | null = null,
	): boolean {
		// uses prepareSimpleSearch to search for matches that end right at cursor.
		// basically, get text from start of line to cursor, do simple search for each snippet lhs in that text, and replace first match that ends right at cursor.

		let curpos = pos ? pos : editor.getCursor();
		let line = curpos.line;
		let curLineText = editor.getLine(line);

		for (let [lhs, search] of Object.entries(this.searches)) {
			let searchResult = search(curLineText);
			if (searchResult) {
				let lastMatchPart = searchResult.matches.find(
					(part) => part[1] === curpos.ch,
				);
				if (lastMatchPart) {
					if (curpos.ch >= lhs.length) {
						// TODO: This change fixes old bug but snippet now triggers even if there is no whitespace before the lhs. Or does it? Verify this...
						// TODO: lhs still cannot have newlines in it. Wouldn't be hard to update however.
						let from: EditorPosition = {
							line: line,
							ch: curpos.ch - lhs.length,
						};
						let to: EditorPosition = { line: line, ch: lastMatchPart[1] };
						let lookBack = editor.getRange(from, to);
						if (lookBack === lhs) {
							editor.replaceRange(this.searchSnippets[lhs], from, to);
							return true;
						}
					}
					// snippet before cursor found but not triggered means no other snippet should trigger
					return false;
				}
			}
		}
		return false;
	}
}

class JellySnippetsSettingTab extends PluginSettingTab {
	plugin: JellySnippets;

	constructor(app: App, plugin: JellySnippets) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Jelly Snippets - Settings" });

		new Setting(containerEl)
			.setName("Search Snippets")
			.setDesc(
				"Specify your search snippets here! Format: 'before<divider>after'. Surrounding your divider with a space is recommended for readability.",
			)
			.addTextArea((textarea) =>
				textarea
					.setPlaceholder(
						`before${this.plugin.settings.snippetPartDivider}after`,
					)
					.setValue(this.plugin.settings.searchSnippetsFile)
					.onChange(async (value) => {
						this.plugin.settings.searchSnippetsFile = value;
						await this.plugin.saveSettings();
						this.plugin.reloadSearchSnippets(); // ? is this necessary to update the snippets?
					}),
			);

		new Setting(containerEl)
			.setName("Snippet line divider")
			.setDesc("This string will divide each separate snippet definition.")
			.addText((text) =>
				text
					.setPlaceholder("-==-")
					.setValue(this.plugin.settings.snippetDivider)
					.onChange(async (value) => {
						this.plugin.settings.snippetDivider = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Snippet part divider")
			.setDesc(
				"This string will divide the lhs and rhs of a snippet definition. (I recommend putting spaces in the ends of this string.)",
			)
			.addText((text) =>
				text
					.setPlaceholder(" |+| ")
					.setValue(this.plugin.settings.snippetPartDivider)
					.onChange(async (value) => {
						this.plugin.settings.snippetPartDivider = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Trigger on Space")
			.setDesc(
				"If enabled, the snippet function will trigger when space is pressed (but not while shift is held).",
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption(AutoTriggerOptions.Disabled, "Disabled")
					// .addOption(AutoTriggerOptions.EnabledNoWS, "Enabled, no whitespace")
					.addOption(
						AutoTriggerOptions.EnabledYesWS,
						"Enabled, also whitespace",
					)
					.setValue(this.plugin.settings.triggerOnSpace)
					.onChange(async (value) => {
						this.plugin.settings.triggerOnSpace = value as AutoTriggerOptions;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Trigger on Enter")
			.setDesc(
				"If enabled, the snippet function will trigger when enter is pressed (but not while shift is held).",
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption(AutoTriggerOptions.Disabled, "Disabled")
					.addOption(AutoTriggerOptions.EnabledNoWS, "Enabled, no whitespace")
					.addOption(
						AutoTriggerOptions.EnabledYesWS,
						"Enabled, also whitespace",
					)
					.setValue(this.plugin.settings.triggerOnEnter)
					.onChange(async (value) => {
						this.plugin.settings.triggerOnEnter = value as AutoTriggerOptions;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Trigger on Tab")
			.setDesc(
				"If enabled, the snippet function will trigger when tab is pressed (but not while shift is held).",
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption(AutoTriggerOptions.Disabled, "Disabled")
					.addOption(AutoTriggerOptions.EnabledNoWS, "Enabled, no whitespace")
					.addOption(
						AutoTriggerOptions.EnabledYesWS,
						"Enabled, also whitespace",
					)
					.setValue(this.plugin.settings.triggerOnTab)
					.onChange(async (value) => {
						this.plugin.settings.triggerOnTab = value as AutoTriggerOptions;
						await this.plugin.saveSettings();
					}),
			);
	}
}
