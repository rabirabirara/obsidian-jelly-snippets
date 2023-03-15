# jelly-snippets
A simple text snippets plugin for Obsidian.md.


## What does it do?

Pretty simple. You probably have run into snippets before.

1. Specify a mapping of snippet to replacement in the settings tab.
	
	`snippet. |+| replacement!`
	
2. If the cursor is at the end of a snippet...
	
	`snippet.<cursor here>`
	
3. ..then triggering the snippet conversion...
	
	`snippet.<cursor here - TRIGGER!>`
	
4. ..will replace the snippet with its replacement!
	
	`replacement!<cursor here>`
	
## Why?

I wanted to make a generic snippets plugin that operated on text and worked as I needed. There is an existing snippets plugin already, [Text Snippets](https://github.com/ArianaKhit/text-snippets-obsidian) by ArianaKhit, but not only is the plugin code somewhat outdated and a little complex, it seems to use an older API.

One of my goals writing this was to write a simple plugin that used the API exactly as described by the [unofficial docs](https://marcus.se.net/obsidian-plugin-docs/) and by vanilla Typescript. I also wanted to make the core functionality of the plugin more flexible, though of course I have yet to add certain features that would truly provide that.

Another motivation was that I wanted to make a plugin by which I could type in my personal note-taking syntax (called JellyNote); I originally was going to write a whole editor extension, but I eventually realized that I could implement it with snippets. So, I'll be adding features to this plugin as long as I need them for JellyNote syntax.

This plugin also reminds me of LaTeX2Unicode, a neovim plugin which I used extensively in my first two years of college. I liked it because it would automatically change latex to unicode on pressing space; that was it. No stretching for the tab key. 

It's since been incorporated back into [julia.vim](https://github.com/JuliaEditorSupport/julia-vim). I didn't originally mean to write a plugin that could provide this kind of functionality - but I suppose the concept of text translation is really useful!

## Future Improvements

- Control characters in snippets (e.g. whitespace, particularly newlines? currently snippets are trimmed on both ends; should probably not trim spaces)
- Semantic symbols in snippets (e.g. where does cursor go afterwards?)
- Regex capabilities
