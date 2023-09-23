# jelly-snippets
A simple text snippets plugin for Obsidian.md.

## BEFORE UPDATING,READ: 

If you have used an older version of this plugin (1.5) or below, updating to version 1.6 will erase your snippets. Backup your snippets before updating; I will update the plugin with a backup functionality later too in case I mess up again. Deepest apologies. 

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

Snippets are defined in a text area (like a file) in settings. Each snippet has two parts: lhs and rhs.

The lhs (left hand side) determines what text gets replaced; the rhs (right hand side) determines what replaces the text.

Naturally, there is a symbol to divide these two halves of a snippet, called a snippet part divider:

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

## Using Symbols (simple)

Say you want to expand `hw` into a full hello-world function. Say we're using Rust. You define the snippet:

```
hw |+| fn hello() {
%\t%\e
}
```

When you trigger the snippet, you'll end up with this:

```
fn hello() {
    |
}
```

... where `|` represents your cursor. Of course, Obsidian is a markdown editor, so expect the little indent guide.

## Why?

I wanted to make a generic snippets plugin that operated on text and worked as I needed. There is an existing snippets plugin already, [Text Snippets](https://github.com/ArianaKhit/text-snippets-obsidian) by ArianaKhit, but not only is the plugin code somewhat outdated and a little complex, it seems to use an older API. (It is a very good plugin by the way.)

One of my goals writing this was to write a simple plugin that used the API exactly as described by the [unofficial docs](https://marcus.se.net/obsidian-plugin-docs/) and by vanilla Typescript. I also wanted to make the core functionality of the plugin more flexible, though of course I have yet to add certain features that would truly provide that.

Another motivation was that I wanted to make a plugin by which I could type in my personal note-taking syntax (called JellyNote); I originally was going to write a whole editor extension, but I eventually realized that I could implement it with snippets. So, I'll be adding features to this plugin as long as I need them for JellyNote syntax.

This plugin also reminds me of LaTeX2Unicode, a neovim plugin which I used extensively in my first two years of college. I liked it because it would automatically change latex to unicode on pressing space; that was it. No stretching for the tab key. 

It's since been incorporated back into [julia.vim](https://github.com/JuliaEditorSupport/julia-vim). I didn't originally mean to write a plugin that could provide this kind of functionality - but I suppose the concept of text translation is really useful!

## Future Improvements/TODO

- [x] Control characters in snippets (whitespace only)
- [x] Semantic symbols in snippets (e.g. where does cursor go afterwards? a snippet with braces might benefit from placing the cursor inside...)
- [ ] Regex capabilities - at least on selection.
- [ ] A backup for snippets - or a way of specifying snippets in a file, to modularize snippets. May be useful if regex snippets need to be defined separately from text snippets.
- [ ] Bugfixes and auditing.
- [ ] Do the things liamcain suggested in my plugin PR to the Obsidian plugin repo. (one half done)
- [ ] Working with Obsidians template stuff.
      
### Other caveats

- None right now, except that the maintainer of this plugin (me) is inexperienced and may break something. Keep your snippets safe if you write a lot of them. 
