## GitHub CodeMirror

<img src="images/icon-128.png" width="128" align="right" />

This replaces the default GitHub Issue textarea (for a New Issue or Comments); with a [CodeMirror running in GFM mixed mode](http://codemirror.net/mode/gfm/).

### GitHub CodeMirror Features

- Full-featured code editor operating in [GFM mixed mode](http://codemirror.net/mode/gfm/).
- Syntax highlighting for fenced code blocks that include a language specifier.
- [Emacs-style shortcuts](http://codemirror.net/demo/emacs.html) for text editing and for code samples.
- The ability to use the Tab key, or Shift-Tab (powered by CodeMirror).
- Supports the `R` key shortcut at GitHub; for quick replies to existing Issues.
- Supports a true fullscreen editing mode. Use `F11` to toggle or click the fullscreen link.
- Adds the ability to upload files of _any_ type (not just images). This is powered by FilePicker.io. Also works in fullscreen mode.
   **Note:** When you click the file upload link for the first time, you will be asked for your [FilePicker.io](https://www.filepicker.io/) key. Please visit [FilePicker.io](https://www.filepicker.io/), signup, and create an App to acquire your key. You only need to enter this one time.

<img src="images/ss.png" align="center" />

### Installation Instructions

- Clone or download the `000000-dev` branch.

	```
	git clone https://github.com/websharks/github-codemirror
	git checkout 000000-dev
	```

- Now open Chrome and go to: `chrome://extensions/`
- Check the "Developer Mode" box at the top right-hand side.
- Click the **Load Unpacked Extension** button at the top of your screen.
- Choose the `github-codemirror` folder and you're set.
- Now just reload the GitHub web interface.

### How to Change the CodeMirror Theme

The default theme is `ambiance` for CodeMirror. However, there are [other themes for CodeMirror](http://codemirror.net/demo/theme.html) that you can choose from. To change the default theme to one that you prefer, please follow these instructions carefully:

- Visit GitHub.com in Google Chrome.
- Open the JavaScript Console in Google Chrome.
- Type: `localStorage.setItem('githubCodemirror_cmTheme', 'ambiance');`. Change `ambiance` to [a theme](http://codemirror.net/demo/theme.html) that you prefer. Press "Enter" to run the command.
- Reload GitHub.com and now you should have the theme that you prefer.