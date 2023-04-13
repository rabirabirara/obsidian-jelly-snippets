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
	
### In greater detail:

Snippets are defined in a text area (like a file) in settings. Each snippet has two parts: lhs and rhs. Naturally, there is a symbol to divide these two halves of a snippet, called a snippet part divider:

` |+| `, for example. (With spaces at the ends.)

	lhs |+| rhs
	
So when you type `lhs` and then trigger the snippet command, it will replace the text `lhs` with `rhs`.
	
And, there is a symbol to divide each separate snippet in the list of snippets, called a snippet divider:

`-==-`, for example.

So if you had the following snippets file:

```
lhs |+| rhs
-==-
superb |+| superbowls
```

Then you would have two snippets. If your divider was `-==-` still and you had the following file:

```
lhs |+| rhs
superb |+| superbowls
```

Then typing `lhs` and triggering the snippet command would replace `lhs` with:

```
rhs
superb |+| superbowls
```

(NOTE: At this point in time, it WON'T work correctly; if you use the part divider in the rhs of a snippet it will fail to register the snippet entirely. I actually have a fix in master for this 066cdab, but I haven't updated the plugin yet.)
	
## Why?

I wanted to make a generic snippets plugin that operated on text and worked as I needed. There is an existing snippets plugin already, [Text Snippets](https://github.com/ArianaKhit/text-snippets-obsidian) by ArianaKhit, but not only is the plugin code somewhat outdated and a little complex, it seems to use an older API. (It is a very good plugin by the way.)

One of my goals writing this was to write a simple plugin that used the API exactly as described by the [unofficial docs](https://marcus.se.net/obsidian-plugin-docs/) and by vanilla Typescript. I also wanted to make the core functionality of the plugin more flexible, though of course I have yet to add certain features that would truly provide that.

Another motivation was that I wanted to make a plugin by which I could type in my personal note-taking syntax (called JellyNote); I originally was going to write a whole editor extension, but I eventually realized that I could implement it with snippets. So, I'll be adding features to this plugin as long as I need them for JellyNote syntax.

This plugin also reminds me of LaTeX2Unicode, a neovim plugin which I used extensively in my first two years of college. I liked it because it would automatically change latex to unicode on pressing space; that was it. No stretching for the tab key. 

It's since been incorporated back into [julia.vim](https://github.com/JuliaEditorSupport/julia-vim). I didn't originally mean to write a plugin that could provide this kind of functionality - but I suppose the concept of text translation is really useful!

## Future Improvements/TODO

- Control characters in snippets (e.g. whitespace, particularly newlines? currently snippets are trimmed on both ends; should probably not trim spaces)
- Semantic symbols in snippets (e.g. where does cursor go afterwards?)
- Regex capabilities
- Bugfixes and auditing?
- Add newline option for snippet definition to make simple snippets easy rather than cumbersome
- Add trigger on enter and a dropdown that allows each setting to either have the whitespace afterwards or not have it. (Currently doesn't work well with Tab; will have to see.)

### Other caveats

- The lhs of a snippet cannot have newlines in it. Snippets of that sort will simply fail to work; they'll register but never trigger. The reason why is because I only search from cursor to start of line for snippet text; this is efficient and simple. To fix, we'd have to look backwards from the cursor position and match with the lhs of the snippet. Probably not a hard update, but given that this use case is somewhat rare (imo), I have neglected it. Do submit an issue.
