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

interface JellySnippetsSettings {
	searchSnippetsFile: string;
	// regexSnippetsFile: string;
	// regexSnippets: [RegExp, string][];
	triggerOnSpace: boolean;
    triggerOnEnter: boolean;
	triggerOnTab: boolean;
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
	triggerOnSpace: true,
    triggerOnEnter: true,
	triggerOnTab: true, // TODO: Fix this so that if snippet triggers, the tab doesn't also go through. In fact, maybe fix it so that space doesn't go through either if snippet triggers.
	snippetPartDivider: " |+| ",
	snippetDivider: "-==-",
	postSnippetCursorSymbol: "%move%",	// TODO: Actually implement this symbol.
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
		if (this.settings.triggerOnSpace || this.settings.triggerOnTab) {
			const onKeyEvent = (evt: KeyboardEvent) => {
				if (
					(!evt.shiftKey) && // * don't trigger if shift is pressed down too however
					((this.settings.triggerOnSpace && evt.code === "Space") ||
					(this.settings.triggerOnTab && evt.code === "Tab"))
					// TODO: Add a dropdown setting so that users can control which modifier key cancels things out, or if any does at all.
				) {
					const view = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (view) {
						this.triggerSearchSnippet(view.editor);
					}
				}
			};

			// Register for main window.
			this.registerDomEvent(document, "keydown", onKeyEvent);

			// If window changes, registerDomEvent for new window if so.
			this.registerEvent(this.app.workspace.on('window-open', (event) => {
				this.registerDomEvent(activeWindow, "keydown", onKeyEvent);
			}));
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

	triggerSearchSnippet(editor: Editor): void {
		// uses prepareSimpleSearch to search for matches that end right at cursor.
		// basically, get text from start of line to cursor, do simple search for each snippet lhs in that text, and replace first match that ends right at cursor.

		let curpos = editor.getCursor();
		let line = curpos.line;
		let curLineText = editor.getLine(line);

		for (let [lhs, search] of Object.entries(this.searches)) {
			let searchResult = search(curLineText);
			if (searchResult) {
				let lateMatchPart = searchResult.matches.find(
					(part) => part[1] === curpos.ch,
				);
				if (lateMatchPart) {
					// Since simpleSearch separates by word for some dumb reason, use the earliest match in searchResult.matches.
					let earlyMatchPart = searchResult.matches[0];
					let from: EditorPosition = { line: line, ch: earlyMatchPart[0] };
					let to: EditorPosition = { line: line, ch: lateMatchPart[1] };
					editor.replaceRange(this.searchSnippets[lhs], from, to);
				}
			}
		}
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
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.triggerOnSpace)
					.onChange(async (value) => {
						this.plugin.settings.triggerOnSpace = value;
						await this.plugin.saveSettings();
					}),
			);

        new Setting(containerEl)
			.setName("Trigger on Enter")
			.setDesc(
				"If enabled, the snippet function will trigger when enter is pressed (but not while shift is held).",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.triggerOnEnter)
					.onChange(async (value) => {
						this.plugin.settings.triggerOnEnter = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Trigger on Tab")
			.setDesc(
				"If enabled, the snippet function will trigger when tab is pressed (but not while shift is held).",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.triggerOnTab)
					.onChange(async (value) => {
						this.plugin.settings.triggerOnTab = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}

